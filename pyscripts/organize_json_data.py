import json
import os
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

class JSONDataOrganizer:
    def __init__(self, data_dir: str = "../data"):
        self.data_dir = data_dir
        self.backup_dir = f"{data_dir}/backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
    def create_backup(self):
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
        
        for filename in ["movie_data.json", "episodes_data.json", "comingsoon_data.json"]:
            filepath = os.path.join(self.data_dir, filename)
            if os.path.exists(filepath):
                backup_path = os.path.join(self.backup_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as src:
                    with open(backup_path, 'w', encoding='utf-8') as dst:
                        dst.write(src.read())
                print(f"Backed up {filename} to {backup_path}")
    
    def load_json_file(self, filename: str) -> List[Dict[str, Any]]:
        filepath = os.path.join(self.data_dir, filename)
        if not os.path.exists(filepath):
            print(f"Warning: {filename} not found")
            return []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error reading {filename}: {e}")
            return []
    
    def standardize_movie_data(self, movies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        standardized = []
        
        for i, movie in enumerate(movies):
            standardized_movie = {
                "id": f"movie_{i+1:03d}",
                "title": movie.get("title", "").strip(),
                "description": movie.get("description", "").strip(),
                "video_url": movie.get("video_url", "").strip(),
                "thumbnail": movie.get("thumbnail", "").strip(),
                "embed_link": movie.get("embed_link", "").strip(),
                "category": "movie",
                "series": self.extract_series_name(movie.get("title", "")),
                "episode_number": self.extract_episode_number(movie.get("title", "")),
                "is_extended": "extended" in movie.get("title", "").lower(),
                "year": self.extract_year(movie.get("title", "")),
                "last_updated": datetime.now().isoformat()
            }
            
            if not standardized_movie["description"]:
                standardized_movie["description"] = f"Watch {standardized_movie['title']}"
            
            standardized.append(standardized_movie)
        
        return sorted(standardized, key=lambda x: (x["series"], x["episode_number"] or 0))
    
    def standardize_episodes_data(self, episodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        standardized = []
        
        for series in episodes:
            series_title = series.get("title", "").strip()
            series_description = series.get("description", "").strip()
            series_thumbnail = series.get("thumbnail", "").strip()
            
            embed_links = series.get("embed_links", [])
            if not isinstance(embed_links, list):
                embed_links = [embed_links] if embed_links else []
            
            for i, episode in enumerate(embed_links):
                if isinstance(episode, dict):
                    standardized_episode = {
                        "id": f"episode_{len(standardized)+1:03d}",
                        "title": episode.get("title", "").strip(),
                        "description": episode.get("description", "").strip(),
                        "video_url": "", 
                        "thumbnail": episode.get("thumbnail", series_thumbnail).strip(),
                        "embed_link": episode.get("embed_link", "").strip(),
                        "category": "episode",
                        "series": series_title,
                        "episode_number": self.extract_episode_number(episode.get("title", "")),
                        "season_number": self.extract_season_number(episode.get("title", "")),
                        "is_extended": False,
                        "year": None,
                        "last_updated": datetime.now().isoformat()
                    }
                    
                    if not standardized_episode["description"]:
                        standardized_episode["description"] = f"Episode of {series_title}"
                    
                    standardized.append(standardized_episode)
        
        return sorted(standardized, key=lambda x: (x["series"], x["season_number"] or 0, x["episode_number"] or 0))
    
    def standardize_coming_soon_data(self, coming_soon: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        standardized = []
        
        for i, item in enumerate(coming_soon):
            standardized_item = {
                "id": f"coming_soon_{i+1:03d}",
                "title": item.get("title", "").strip(),
                "description": item.get("description", "").strip(),
                "video_url": "",
                "thumbnail": item.get("thumbnail", "").strip(),
                "embed_link": "",
                "category": "coming_soon",
                "series": self.extract_series_name(item.get("title", "")),
                "episode_number": None,
                "is_extended": False,
                "year": self.extract_year(item.get("description", "")),
                "release_dates": self.extract_release_dates(item.get("description", "")),
                "last_updated": datetime.now().isoformat()
            }
            
            if not standardized_item["description"]:
                standardized_item["description"] = f"Coming soon: {standardized_item['title']}"
            
            standardized.append(standardized_item)
        
        return sorted(standardized, key=lambda x: x["title"])
    
    def extract_series_name(self, title: str) -> str:
        series_patterns = [
            r"(Hammy and Olivia|Hammy & Olivia)",
            r"(Timmy Vs Jimmy)",
            r"(Gorilla Tag)",
            r"(Beluga and the)",
            r"(Smudge's Adventures)",
            r"(Dystopian Cats)",
            r"(The Melon Sandbox)",
            r"(The Talking Kitty Cat)",
            r"(Evil Cat)",
            r"(Sanic Chase)",
            r"(SHADOW\.)",
            r"(Beluga Gets Ready)"
        ]
        
        for pattern in series_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "Other"
    
    def extract_episode_number(self, title: str) -> Optional[int]:
        patterns = [
            r"Part (\d+)",
            r"Movie (\d+)",
            r"Episode (\d+)",
            r"S\d+E(\d+)",
            r"(\d+)$"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        
        return None
    
    def extract_season_number(self, title: str) -> Optional[int]:
        match = re.search(r"S(\d+)E", title, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        return None
    
    def extract_year(self, text: str) -> Optional[int]:
        year_match = re.search(r'20\d{2}', text)
        if year_match:
            try:
                return int(year_match.group())
            except ValueError:
                pass
        return None
    
    def extract_release_dates(self, description: str) -> Dict[str, str]:
        dates = {}
        yt_match = re.search(r'Releasing on YT (.+?)(?:\n|$)', description)
        lpf_match = re.search(r'Releasing on LPF\+ (.+?)(?:\n|$)', description)
        
        if yt_match:
            dates["youtube"] = yt_match.group(1).strip()
        if lpf_match:
            dates["lpf_plus"] = lpf_match.group(1).strip()
        
        return dates
    
    def create_organized_structure(self) -> Dict[str, Any]:
        movies = self.load_json_file("movie_data.json")
        episodes = self.load_json_file("episodes_data.json")
        coming_soon = self.load_json_file("comingsoon_data.json")
        
        organized_data = {
            "metadata": {
                "total_movies": len(movies),
                "total_episodes": len(episodes),
                "total_coming_soon": len(coming_soon),
                "organized_at": datetime.now().isoformat(),
                "version": "1.0"
            },
            "series": {},
            "categories": {
                "movies": self.standardize_movie_data(movies),
                "episodes": self.standardize_episodes_data(episodes),
                "coming_soon": self.standardize_coming_soon_data(coming_soon)
            }
        }
        
        all_items = organized_data["categories"]["movies"] + organized_data["categories"]["episodes"]
        
        for item in all_items:
            series_name = item["series"]
            if series_name not in organized_data["series"]:
                organized_data["series"][series_name] = {
                    "title": series_name,
                    "movies": [],
                    "episodes": [],
                    "total_items": 0
                }
            
            if item["category"] == "movie":
                organized_data["series"][series_name]["movies"].append(item)
            elif item["category"] == "episode":
                organized_data["series"][series_name]["episodes"].append(item)
            
            organized_data["series"][series_name]["total_items"] += 1
        
        return organized_data
    
    def save_organized_data(self, data: Dict[str, Any]):
        output_file = os.path.join(self.data_dir, "organized_data.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Organized data saved to {output_file}")
        
        summary_file = os.path.join(self.data_dir, "data_summary.json")
        summary = {
            "total_movies": data["metadata"]["total_movies"],
            "total_episodes": data["metadata"]["total_episodes"],
            "total_coming_soon": data["metadata"]["total_coming_soon"],
            "series_count": len(data["series"]),
            "series_list": list(data["series"].keys()),
            "last_updated": data["metadata"]["organized_at"]
        }
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        print(f"Data summary saved to {summary_file}")
    
    def validate_data(self, data: Dict[str, Any]) -> List[str]:
        errors = []
        
        for category, items in data["categories"].items():
            for i, item in enumerate(items):
                if not item.get("title"):
                    errors.append(f"Missing title in {category}[{i}]")
                if not item.get("id"):
                    errors.append(f"Missing ID in {category}[{i}]")
                if not item.get("thumbnail"):
                    errors.append(f"Missing thumbnail in {category}[{i}]")
        
        return errors
    
    def organize(self):
        print("Starting JSON data organization...")
        
        self.create_backup()
        
        organized_data = self.create_organized_structure()
        
        errors = self.validate_data(organized_data)
        if errors:
            print("Validation errors found:")
            for error in errors:
                print(f"  - {error}")
        else:
            print("Data validation passed!")
        
        self.save_organized_data(organized_data)
        
        print(f"\nOrganization complete!")
        print(f"Total movies: {organized_data['metadata']['total_movies']}")
        print(f"Total episodes: {organized_data['metadata']['total_episodes']}")
        print(f"Total coming soon: {organized_data['metadata']['total_coming_soon']}")
        print(f"Series found: {len(organized_data['series'])}")
        
        for series_name, series_data in organized_data["series"].items():
            print(f"  - {series_name}: {series_data['total_items']} items")

if __name__ == "__main__":
    organizer = JSONDataOrganizer()
    organizer.organize() 