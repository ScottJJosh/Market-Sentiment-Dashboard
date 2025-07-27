import requests
import os
from dotenv import load_dotenv
from models.VADER_Sentiment import analyze_sentiment
# Load environment variables from .env file
load_dotenv()


COMPANY_KEYWORDS = {
    'AAPL': ['Apple', 'iPhone', 'iPad', 'Mac', 'iOS', 'App Store', 'Tim Cook'],
    'GOOGL': ['Google', 'Alphabet', 'YouTube', 'Android', 'Chrome', 'Sundar Pichai'],
    'MSFT': ['Microsoft', 'Windows', 'Azure', 'Office', 'Xbox', 'Satya Nadella'],
    'AMZN': ['Amazon', 'AWS', 'Alexa', 'Prime', 'Jeff Bezos', 'Andy Jassy'],
    'META': ['Meta', 'Facebook', 'Instagram', 'WhatsApp', 'Mark Zuckerberg'],
    'TSLA': ['Tesla', 'Elon Musk', 'Model 3', 'Model Y', 'Cybertruck', 'Supercharger'],
    'NVDA': ['Nvidia', 'GeForce', 'AI chips', 'Jensen Huang', 'RTX']
}


def fetch_headlines(category, count=100):
    """
    Fetches the latest news headlines for a given category.
    
    Parameters:
    category (str): The category of news to fetch (e.g., 'business', 'technology').
    count (int): The number of headlines to fetch. Default is 100.
    
    Returns:
    list: A list of article dictionaries with all available fields.
    """
    
    api_key = os.getenv('NEWS_API_KEY')

    if not api_key:
        raise ValueError("API key not found. Please set the NEWS_API_KEY environment variable.")
    
    url = f"https://newsapi.org/v2/top-headlines?category={category}&pageSize={count}&apiKey={api_key}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        articles = []
        
        for article in data['articles']:
            article_data = {
                'title': article.get('title'),
                'description': article.get('description'),
                'content': article.get('content'),
                'url': article.get('url'),
                'urlToImage': article.get('urlToImage'),
                'publishedAt': article.get('publishedAt'),
                'source': article.get('source', {}).get('name'),
                'author': article.get('author')
            }
            articles.append(article_data)
        
        return articles
    else:
        return {
            'error': True,
            'status_code': response.status_code,
            'message': 'There was an error fetching the news headlines.'
        }
    

def filter_relevant_articles(articles, company_keywords):
    """
    Filter articles by company relevance - can match multiple companies
    
    Parameters:
    articles (list): Your news articles  
    company_keywords (dict): Your COMPANY_KEYWORDS dict
    
    Returns:
    dict: {symbol: [relevant_articles]}
    """
    
    relevant_articles = {symbol: [] for symbol in company_keywords.keys()}
    
    for article in articles:
        # Combine title and description for searching
        search_text = ""
        if article.get('title'):
            search_text += article['title']
        if article.get('description'):
            search_text += " " + article['description']
        
        # Convert to lowercase for case-insensitive matching
        search_text = search_text.lower()
        
        # Check each company's keywords
        for symbol, keywords in company_keywords.items():
            for keyword in keywords:
                if keyword.lower() in search_text:
                    relevant_articles[symbol].append(article)
                    break  # Found a match, no need to check other keywords for this company
    
    return relevant_articles

# Example usage:

def test_full_pipeline():
    """
    Test the complete data collection and sentiment analysis pipeline
    """
    print("=== StockPulse Full Pipeline Test ===\n")
    
    # Step 1: Collect news articles
    print("1. Collecting business news...")
    business_articles = fetch_headlines('business', count=50)
    
    print("2. Collecting technology news...")
    tech_articles = fetch_headlines('technology', count=50)
    
    if isinstance(business_articles, dict) and business_articles.get('error'):
        print(f"Error in business news: {business_articles}")
        return
        
    if isinstance(tech_articles, dict) and tech_articles.get('error'):
        print(f"Error in tech news: {tech_articles}")
        return
    
    # Combine articles
    all_articles = business_articles + tech_articles
    print(f"Total articles collected: {len(all_articles)}\n")
    
    # Step 2: Filter for relevant companies
    print("3. Filtering articles for relevant companies...")
    filtered_articles = filter_relevant_articles(all_articles, COMPANY_KEYWORDS)
    
    total_relevant = sum(len(articles) for articles in filtered_articles.values())
    print(f"Total relevant articles found: {total_relevant}")
    
    for symbol, articles in filtered_articles.items():
        print(f"  {symbol}: {len(articles)} articles")
    print()
    
    # Step 3: Analyze sentiment for each company's articles
    print("4. Analyzing sentiment...")
    sentiment_results = {}
    
    for symbol, articles in filtered_articles.items():
        if articles:
            print(f"\n--- {symbol} Sentiment Analysis ---")
            company_sentiments = []
            
            for i, article in enumerate(articles[:5]):  # Analyze first 5 articles
                text = f"{article['title']} {article.get('description', '')}"
                sentiment = analyze_sentiment(text)
                company_sentiments.append(sentiment)
                
                print(f"Article {i+1}: {sentiment['classification']} ({sentiment['compound']:.3f})")
                print(f"  Title: {article['title'][:60]}...")
            
            # Calculate average sentiment for the company
            avg_compound = sum(s['compound'] for s in company_sentiments) / len(company_sentiments)
            sentiment_results[symbol] = {
                'articles_count': len(articles),
                'analyzed_count': len(company_sentiments),
                'average_sentiment': avg_compound,
                'classification': 'positive' if avg_compound > 0.1 else 'negative' if avg_compound < -0.1 else 'neutral'
            }
    
    # Step 4: Summary
    print("\n=== PIPELINE SUMMARY ===")
    print(f"Articles collected: {len(all_articles)}")
    print(f"Relevant articles: {total_relevant}")
    print(f"Companies with news: {len([s for s in sentiment_results.keys() if sentiment_results[s]['articles_count'] > 0])}")
    
    print("\nCompany Sentiment Overview:")
    for symbol, results in sentiment_results.items():
        if results['articles_count'] > 0:
            print(f"{symbol}: {results['classification']} sentiment ({results['average_sentiment']:.3f}) from {results['articles_count']} articles")
    
    return sentiment_results

# Run the full pipeline test
pipeline_results = test_full_pipeline()



