import json, urllib.parse

# with open("data.json", 'r', encoding='utf-8') as f:
#     json_input = json.loads(f.read())
# with open("data.txt", 'r', encoding='utf-8') as f:
#     links_data = f.read()

# print(len(links_data.splitlines()))
# print(len(json_input))

# i = 0
# for line in links_data.splitlines():
#     i += 1
#     json_input[i-1]["embed_link"] = line

# # Optional: Save the updated JSON to a file
# with open("updated_data.json", 'w', encoding='utf-8') as f:
#     json.dump(json_input, f, ensure_ascii=False, indent=2)
def encode_url_path_only(url: str) -> str:
    # Parse the URL
    parsed = urllib.parse.urlsplit(url)
    
    # Split path into parts (to avoid encoding the slashes)
    path_parts = parsed.path.split('/')
    
    # Encode each path segment individually
    encoded_parts = [urllib.parse.quote(part, safe='') for part in path_parts]
    
    # Recombine the path
    encoded_path = '/'.join(encoded_parts)
    
    # Reconstruct the full URL
    encoded_url = urllib.parse.urlunsplit((
        parsed.scheme,
        parsed.netloc,
        encoded_path,
        parsed.query,
        parsed.fragment
    ))
    
    return encoded_url

with open("data.json", 'r', encoding='utf-8') as f:
    json_input = json.loads(f.read())

print(len(json_input))

i = 0
for movie in json_input:
    i += 1
    movie["embed_link"] = encode_url_path_only(movie["embed_link"])

# Optional: Save the updated JSON to a file
with open("updated_data.json", 'w', encoding='utf-8') as f:
    json.dump(json_input, f, ensure_ascii=False, indent=2)