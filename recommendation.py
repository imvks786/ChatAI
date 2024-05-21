# GOOGLE API
import requests

def search(query):
    api_key = 'YOUR_API_KEY'
    cx = 'CX_CODE'
    
    url = f'https://www.googleapis.com/customsearch/v1?key={api_key}{cx}&q={query}'
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data
    else:
        return {'error': 'Failed to fetch search results'}
    

