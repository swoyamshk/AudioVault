import pandas as pd
import numpy as np
import random
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors
import logging

app = Flask(__name__)
CORS(app)

# Load and preprocess dataset
dataset_df = pd.read_csv('dataset3.csv')

# Select numerical features relevant for recommendations
feature_columns = ["valence_tags", "arousal_tags", "dominance_tags"]
song_features = dataset_df[feature_columns]

# Normalize features for better distance calculation
scaler = MinMaxScaler()
normalized_features = scaler.fit_transform(song_features)

# Train KNN model
knn = NearestNeighbors(n_neighbors=10, metric='euclidean')
knn.fit(normalized_features)

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
                'spotify_id': track['id']
            })
        return tracks
    return None

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Function to recommend songs using KNN
def recommend_with_knn(songs):
    recommended_tracks = []
    seen_tracks = set()

    for song in songs:
        song_name = song.get('track_name')
        song_artist = song.get('artist_name')
        logging.debug(f"Processing song: {song_name}, Artist: {song_artist}")

        if not song_name or not song_artist:
            logging.error("Song name or artist is missing!")
            continue

        # Search for the track in dataset2
        song_data = dataset_df[
            (dataset_df["track"].str.lower() == song_name.lower()) &
            (dataset_df["artist"].str.lower() == song_artist.lower())
        ]

        if not song_data.empty:
            song_index = song_data.index[0]
            distances, indices = knn.kneighbors([normalized_features[song_index]])

            for idx in indices[0]:
                track_key = (dataset_df.iloc[idx]["track"], dataset_df.iloc[idx]["artist"])
                if track_key not in seen_tracks:
                    recommended_tracks.append({
                        'track_name': dataset_df.iloc[idx]["track"],
                        'artist_name': dataset_df.iloc[idx]["artist"],
                        'spotify_id': dataset_df.iloc[idx]["spotify_id"],
                        'genre': dataset_df.iloc[idx]["genre"]
                    })
                    seen_tracks.add(track_key)

            if len(recommended_tracks) >= 10:
                break

    return recommended_tracks

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

        recommended_tracks = recommend_with_knn(playlist_tracks)

        return jsonify(recommended_tracks)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)