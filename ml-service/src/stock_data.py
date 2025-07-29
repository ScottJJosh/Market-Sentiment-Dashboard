import requests
import os
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def fetch_stock_data(symbol):
    """
    Fetches 3 months of daily stock data for a single symbol.
    
    Parameters:
    symbol (str): Stock symbol (e.g., 'AAPL')
    
    Returns:
    list: List of dicts with date and close price
          [{'date': '2024-07-25', 'close': 150.23}, ...]
    or dict: Error dict {'error': True, 'message': '...'}
    """
    
    api_key = os.getenv('ALPHA_VANTAGE_KEY')
    
    if not api_key:
        return {'error': True, 'message': 'Alpha Vantage API key not found'}
    
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=full&apikey={api_key}"
    
    try:
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for API error messages
            if "Error Message" in data:
                return {'error': True, 'message': f'Invalid symbol: {symbol}'}
            
            if "Note" in data:
                return {'error': True, 'message': 'API rate limit exceeded'}
            
            # Extract time series data
            time_series = data.get('Time Series (Daily)', {})
            
            if not time_series:
                return {'error': True, 'message': f'No data found for {symbol}'}
            
            # Convert to list format and get last 3 months (approximately 90 days)
            stock_data = []
            for date, price_data in list(time_series.items())[:90]:
                stock_data.append({
                    'date': date,
                    'close': float(price_data['4. close'])
                })
            
            return stock_data
            
        else:
            return {'error': True, 'message': f'HTTP {response.status_code}: Request failed'}
    
    except requests.exceptions.RequestException as e:
        return {'error': True, 'message': f'Network error: {str(e)}'}
    
    except Exception as e:
        return {'error': True, 'message': f'Unexpected error: {str(e)}'}

def fetch_multiple_stocks(symbols):
    """
    Fetches stock data for multiple symbols with rate limiting.
    
    Parameters:
    symbols (list): List of stock symbols ['AAPL', 'GOOGL', ...]
    
    Returns:
    dict: {symbol: stock_data} where stock_data is list or error dict
    """
    
    results = {}
    
    for i, symbol in enumerate(symbols):
        print(f"Fetching data for {symbol} ({i+1}/{len(symbols)})...")
        
        # Fetch the stock data
        stock_data = fetch_stock_data(symbol)
        results[symbol] = stock_data
        
        # Check if we need to wait (after every 5 calls, but not after the last one)
        if (i + 1) % 5 == 0 and (i + 1) < len(symbols):
            print("Rate limit: Waiting 60 seconds...")
            time.sleep(60)
        
        # Small delay between individual calls to be nice to the API
        elif (i + 1) < len(symbols):
            time.sleep(12)  # 12 seconds = 5 calls per minute
    
    return results


if __name__ == "__main__":
    # Test with your tech companies
    tech_stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA']
    all_stock_data = fetch_multiple_stocks(tech_stocks)

    # Check results
    for symbol, data in all_stock_data.items():
        if isinstance(data, dict) and data.get('error'):
            print(f"{symbol}: Error - {data['message']}")
        else:
            print(f"{symbol}: Success - {len(data)} days of data")
            print(data[:5])

