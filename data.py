import pandas as pd

# Load the Spotify dataset (contains thousands of random songs)
dataset_file = 'dataset.csv'
column_names = [
    'user_id', 'track_id', 'artists', 'album_name', 'track_name', 'popularity', 
    'duration_ms', 'explicit', 'danceability', 'energy', 'key', 'loudness', 
    'mode', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 
    'valence', 'tempo', 'time_signature', 'track_genre'  # Assuming 'track_genre' exists
]
# Read dataset with dtype=str to avoid mixed data types
spotify_df = pd.read_csv(dataset_file, names=column_names, dtype=str, low_memory=False)

# Load the playlist file
playlist_file = 'playlist.csv'
playlist_df = pd.read_csv(playlist_file, dtype=str)

# Rename 'Spotify - id' to 'track_id' to match dataset.csv
playlist_df.rename(columns={'Spotify - id': 'track_id'}, inplace=True)

# Ensure playlist has the correct column
if 'track_id' not in playlist_df.columns:
    raise ValueError("The playlist file must contain a 'track_id' column.")

# Function to recommend songs based on genre from dataset.csv
def recommend_based_on_genre(n_recommendations=5):
    # Get track_ids that are in the playlist
    playlist_track_ids = playlist_df['track_id'].tolist()
    
    # Get the genre for the first song in the playlist (or a random one)
    playlist_song_id = playlist_df.iloc[0]['track_id']
    genre_to_match = spotify_df.loc[spotify_df['track_id'] == playlist_song_id, 'track_genre'].values[0]

    # Filter dataset to only include songs that match the genre
    genre_songs = spotify_df[spotify_df['track_genre'] == genre_to_match]
    
    # Exclude songs already in the playlist
    new_songs = genre_songs[~genre_songs['track_id'].isin(playlist_track_ids)]

    if new_songs.empty:
        print(f"No new songs found with the genre {genre_to_match}.")
        return
    
    # Randomly sample songs from the filtered dataset
    recommended_songs = new_songs.sample(n=min(n_recommendations, len(new_songs)))

    print(f"Recommended New Songs (Genre: {genre_to_match}):")
    for i, song in enumerate(recommended_songs.itertuples(), 1):
        print(f"Recommendation {i}: {song.track_name} by {song.artists}")

# Example: Recommend 5 new songs based on genre
recommend_based_on_genre()
