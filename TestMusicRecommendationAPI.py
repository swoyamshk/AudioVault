import unittest
from unittest.mock import patch, MagicMock
from recommend_api import get_playlist_tracks, recommend_based_on_playlist
import json
from recommend_api import app  # Ensure app is defined in recommend_api.py

class TestMusicRecommendationAPI(unittest.TestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    @patch("recommend_api.requests.get")  # Fixed patch path
    def test_get_playlist_tracks_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {"track": {"name": "Song1", "artists": [{"name": "Artist1"}], "album": {"name": "Album1"}, "id": "1"}},
                {"track": {"name": "Song2", "artists": [{"name": "Artist2"}], "album": {"name": "Album2"}, "id": "2"}}
            ]
        }
        mock_get.return_value = mock_response

        tracks = get_playlist_tracks("playlist123", "fake_token")
        self.assertEqual(len(tracks), 2)
        self.assertEqual(tracks[0]['track_name'], "Song1")

    @patch("recommend_api.requests.get")  # Fixed patch path
    def test_get_playlist_tracks_failure(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {}
        mock_get.return_value = mock_response

        tracks = get_playlist_tracks("playlist123", "fake_token")
        self.assertIsNone(tracks)

    @patch("recommend_api.recommend_based_on_playlist")  # Fixed patch path
    @patch("recommend_api.get_playlist_tracks")  # Fixed patch path
    def test_recommend_similar_music(self, mock_get_playlist_tracks, mock_recommend):
        mock_get_playlist_tracks.return_value = [
            {"track_name": "Song1", "artist_name": "Artist1", "album": "Album1", "spotify_id": "1"}
        ]

        mock_recommend.return_value = [
            {"track_name": "RecSong1", "artist_name": "RecArtist1", "album": "RecAlbum1", "spotify_id": "101"}
        ]

        response = self.app.post("/recommend-similar", 
                                 data=json.dumps({"playlist_id": "123", "access_token": "fake_token"}),
                                 content_type='application/json')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['track_name'], "RecSong1")

    def test_recommend_similar_music_missing_params(self):
        response = self.app.post("/recommend-similar", data=json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn("error", data)

if __name__ == "__main__":
    unittest.main()
