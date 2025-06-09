import yt_dlp, requests, json, os, tempfile

def upload_to_catbox(file_path):
    url = 'https://catbox.moe/user/api.php'
    with open(file_path, 'rb') as f:
        files = {'fileToUpload': f}
        data = {
            'reqtype': 'fileupload'
        }
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            return response.text.strip()
        else:
            raise Exception(f"Catbox upload failed: {response.status_code} {response.text}")

def process_playlist(playlist_url, output_file='output.json'):
    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
        'force_generic_extractor': False
    }

    print(f"[INFO] Extracting playlist: {playlist_url}")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        playlist_info = ydl.extract_info(playlist_url, download=False)

    if 'entries' not in playlist_info:
        raise Exception("No videos found in the playlist.")

    results = []

    for index, entry in enumerate(playlist_info['entries']):
        print(f"[INFO] Processing video {index + 1}/{len(playlist_info['entries'])}: {entry['url']}")
        video_url = f"https://www.youtube.com/watch?v={entry['id']}"
        
        # Extract full metadata for this video
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            video_info = ydl.extract_info(video_url, download=False)

        title = video_info.get('title')
        description = video_info.get('description', '')
        thumb_url = video_info.get('thumbnail')

        if not thumb_url:
            print(f"[WARN] No thumbnail for video: {title}")
            catbox_url = None
        else:
            try:
                thumb_data = requests.get(thumb_url)
                thumb_data.raise_for_status()

                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_thumb:
                    tmp_thumb.write(thumb_data.content)
                    tmp_thumb_path = tmp_thumb.name

                catbox_url = upload_to_catbox(tmp_thumb_path)
                os.unlink(tmp_thumb_path)
            except Exception as e:
                print(f"[ERROR] Failed to upload thumbnail for '{title}': {e}")
                catbox_url = None

        results.append({
            'title': title,
            'description': description,
            'video_url': video_url,
            'thumbnail': catbox_url
        })

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"[DONE] JSON written to: {output_file}")

# Example usage:
if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python youtube_playlist_to_json.py <playlist_url>")
        sys.exit(1)

    playlist_url = sys.argv[1]
    process_playlist(playlist_url)


