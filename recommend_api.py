import pandas as pd
import random
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the updated dataset
dataset_df = pd.read_csv('dataset2.csv')

# Function to get playlist tracks from Spotify
def get_playlist_tracks(playlist_id, access_token):
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        tracks = []
        for item in data['items']:
            track = item['track']
            tracks.append({
                'track_name': track['name'],
                'artist_name': track['artists'][0]['name'],
                'album': track['album']['name'],
                'spotify_id': track['id']
            })
        return tracks
    return None

# Function to recommend similar music based on randomly selected songs
def recommend_based_on_playlist(songs):
    recommended_tracks = []
    seen_tracks = set()

    # Select 3 to 5 random songs from the playlist
    num_samples = min(10, len(songs['songs']))  # Pick up to 10 songs or fewer if the playlist is smaller
    random_songs = random.sample(songs['songs'], num_samples)

    print(f"Processing {num_samples} random songs from playlist...")

    playlist_track_names = {song['track_name'].lower() for song in songs['songs']}  # Avoid duplicates

    for song in random_songs:
        album = song['album']
        artist = song['artist_name']

        print(f"Processing: {song['track_name']} by {artist} (Album: {album})")

        # Find similar tracks by album
        similar_tracks = dataset_df[dataset_df['album'] == album]

        # If no match by album, try matching by artist
        if similar_tracks.empty:
            similar_tracks = dataset_df[dataset_df['artists'].str.contains(artist, case=False, na=False)]

        # If still no match, try finding tracks with similar genres or other criteria
        if similar_tracks.empty:
            similar_tracks = dataset_df.sample(n=10)  # Fallback: random tracks

        # Filter out duplicate songs
        similar_tracks = similar_tracks[~similar_tracks['name'].str.lower().isin(playlist_track_names)]

        # Shuffle and add recommendations
        for _, row in similar_tracks.sample(frac=1).iterrows():  # Shuffle results for randomness
            track_key = (row['name'], row['artists'])
            if track_key not in seen_tracks:
                recommended_tracks.append({
                    'track_name': row['name'],
                    'artist_name': row['artists'],
                    'album': row['album'],
                    'spotify_id': row['id']
                })
                seen_tracks.add(track_key)

            # Stop when we have enough recommendations (across all songs)
            if len(recommended_tracks) >= 10:
                break

        if len(recommended_tracks) >= 10:
            break

    return recommended_tracks  # Return recommendations from all selected songs
@app.route("/recommend-similar", methods=["POST"])
def recommend_similar_music():
    try:
        data = request.json
        playlist_id = data.get("playlist_id")
        access_token = data.get("access_token")

        if not playlist_id or not access_token:
            return jsonify({"error": "Playlist ID and access token are required"}), 400

        playlist_tracks = get_playlist_tracks(playlist_id, access_token)

        if not playlist_tracks:
            return jsonify({"error": "No tracks found in the playlist"}), 400

        recommended_tracks = recommend_based_on_playlist({"songs": playlist_tracks})

        return jsonify(recommended_tracks)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    

if __name__ == "__main__":
    app.run(debug=True, port=5001)
