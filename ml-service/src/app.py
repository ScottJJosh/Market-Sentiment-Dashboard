# ml-service/src/app.py - UPDATED VERSION
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime

# Add models directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

# Import your existing functions
from models.Combined_Sentiment import analyze_sentiment_combined
from news_Collection import fetch_headlines, filter_relevant_articles, full_pipeline, COMPANY_KEYWORDS
from database_queries import (
    get_articles_with_sentiment, 
    get_correlation_data, 
    get_batch_sentiment_summary,
    check_data_freshness,
    get_api_usage_today
)

app = Flask(__name__)
CORS(app)

# API Limits
MAX_NEWS_CALLS_PER_DAY = 100  # Adjust based on your plan
MAX_STOCK_CALLS_PER_DAY = 5   # Alpha Vantage free tier

@app.route('/', methods=['GET'])
def health_check():
    usage = get_api_usage_today()
    return jsonify({
        'message': 'TradingEmotion ML Service is running!',
        'version': '2.0.0',
        'api_usage_today': usage,
        'endpoints': ['/analyze-sentiment', '/analyze-text', '/analyze-correlation', '/get-news', '/analyze-batch', '/refresh-data']
    })

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_stock_sentiment():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        print(f"Getting ALL stored articles for {symbol}")
        
        # Get ALL articles from database
        articles = get_articles_with_sentiment(symbol, days_back=365, limit=100)
        
        if not articles:
            return jsonify({
                'symbol': symbol,
                'articles_analyzed': 0,
                'overall_sentiment': None,
                'articles': [],
                'message': f'No articles found for {symbol}'
            })
        
        # Calculate overall sentiment from stored articles
        sentiment_scores = [article['sentiment_score'] for article in articles if article['sentiment_score'] is not None]
        
        if sentiment_scores:
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            
            if avg_sentiment > 0.1:
                classification = 'positive'
            elif avg_sentiment < -0.1:
                classification = 'negative'
            else:
                classification = 'neutral'
        else:
            avg_sentiment = 0
            classification = 'neutral'
        
        return jsonify({
            'symbol': symbol,
            'articles_analyzed': len(articles),
            'overall_sentiment': {
                'score': avg_sentiment,
                'classification': classification
            },
            'articles': articles,
            'source': 'database'
        })
        
    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-correlation', methods=['POST'])
def analyze_correlation():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        # Get correlation data from database
        correlations = get_correlation_data(symbol, days_back=90)
        
        if not correlations:
            return jsonify({
                'symbol': symbol,
                'correlation_data': [],
                'message': f'No correlation data found for {symbol}. Try running data collection first.'
            })
        
        # Calculate summary stats
        positive_sentiment_days = [c for c in correlations if c['sentiment'] > 0.1]
        negative_sentiment_days = [c for c in correlations if c['sentiment'] < -0.1]
        
        avg_positive_price_change = (
            sum(c['price_change'] for c in positive_sentiment_days) / len(positive_sentiment_days)
            if positive_sentiment_days else 0
        )
        
        avg_negative_price_change = (
            sum(c['price_change'] for c in negative_sentiment_days) / len(negative_sentiment_days)
            if negative_sentiment_days else 0
        )
        
        summary = {
            'total_correlations': len(correlations),
            'positive_sentiment_days': len(positive_sentiment_days),
            'negative_sentiment_days': len(negative_sentiment_days),
            'avg_positive_price_change': avg_positive_price_change,
            'avg_negative_price_change': avg_negative_price_change
        }
        
        return jsonify({
            'symbol': symbol,
            'correlation_data': correlations,
            'summary': summary,
            'source': 'database'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-news', methods=['POST'])
def get_filtered_news():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        count = data.get('count', 50)
        days_back = data.get('days_back', 7)
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        # Get news from database first
        articles = get_articles_with_sentiment(symbol, days_back=days_back, limit=count)
        
        return jsonify({
            'symbol': symbol,
            'relevant_articles': len(articles),
            'articles': articles,
            'source': 'database',
            'days_back': days_back
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-batch', methods=['POST'])
def analyze_batch_sentiment():
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        if not symbols:
            return jsonify({'error': 'Symbols array is required'}), 400
        
        # Get batch data from database
        results = get_batch_sentiment_summary()
        
        # Ensure all requested symbols are included
        for symbol in symbols:
            if symbol not in results:
                results[symbol] = {
                    'articles_found': 0,
                    'overall_sentiment': None,
                    'message': f'No data found for {symbol}'
                }
        
        return jsonify({
            'symbols_analyzed': len(symbols),
            'results': {k: v for k, v in results.items() if k in symbols},
            'source': 'database'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add this to your ml-service/src/app.py - REPLACE the existing refresh-data endpoint

@app.route('/refresh-data', methods=['POST'])
def refresh_data():
    """Fetch NEW articles and ADD them to existing database (accumulative)"""
    try:
        usage = get_api_usage_today()
        
        if usage['news_calls'] >= MAX_NEWS_CALLS_PER_DAY:
            return jsonify({
                'error': 'Daily API limit reached',
                'usage': usage,
                'message': 'Cannot fetch new articles today. Using existing database articles.'
            }), 429
        
        print("=== REFRESH DATA: Fetching NEW articles to ADD to database ===")
        
        # Count articles before refresh
        from database_queries import get_articles_with_sentiment
        before_counts = {}
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA']
        
        for symbol in symbols:
            articles = get_articles_with_sentiment(symbol, days_back=365, limit=1000)
            before_counts[symbol] = len(articles)
            print(f"Before refresh - {symbol}: {len(articles)} articles")
        
        # Fetch fresh articles from NewsAPI
        print("Fetching fresh articles from NewsAPI...")
        tech_articles = fetch_headlines('technology', count=50)
        business_articles = fetch_headlines('business', count=50)
        
        if isinstance(tech_articles, dict) and tech_articles.get('error'):
            return jsonify({'error': f'News API error: {tech_articles["message"]}'}), 500
            
        if isinstance(business_articles, dict) and business_articles.get('error'):
            return jsonify({'error': f'News API error: {business_articles["message"]}'}), 500
        
        all_articles = tech_articles + business_articles
        print(f"Fetched {len(all_articles)} total articles from NewsAPI")
        
        # Filter for relevant companies
        filtered_articles = filter_relevant_articles(all_articles, COMPANY_KEYWORDS)
        
        # Process and save new articles
        from database import save_article, save_sentiment_score, get_stock_id
        
        new_articles_added = {}
        total_new_articles = 0
        
        for symbol, articles in filtered_articles.items():
            new_articles_added[symbol] = 0
            stock_id = get_stock_id(symbol)
            
            if not stock_id:
                print(f"❌ Stock {symbol} not found in database")
                continue
            
            print(f"\nProcessing {len(articles)} articles for {symbol}...")
            
            for article in articles:
                # Try to save article (will be ignored if URL already exists due to ON CONFLICT)
                article_id = save_article(article, [symbol])
                
                if article_id:  # New article was saved
                    # Analyze sentiment for new article
                    text = f"{article['title']} {article.get('description', '')}"
                    sentiment = analyze_sentiment_combined(text)
                    
                    # Save sentiment score
                    sentiment_id = save_sentiment_score(
                        article_id,
                        stock_id,
                        sentiment['combined_score']
                    )
                    
                    if sentiment_id:
                        new_articles_added[symbol] += 1
                        total_new_articles += 1
                        print(f"✅ Added new article for {symbol}: {article['title'][:50]}...")
                else:
                    print(f"⚠️  Article already exists (skipped): {article['title'][:50]}...")
        
        # Count articles after refresh
        print("\n=== REFRESH RESULTS ===")
        after_counts = {}
        for symbol in symbols:
            articles = get_articles_with_sentiment(symbol, days_back=365, limit=1000)
            after_counts[symbol] = len(articles)
            added = after_counts[symbol] - before_counts[symbol]
            print(f"After refresh - {symbol}: {after_counts[symbol]} articles (+{added} new)")
        
        return jsonify({
            'message': 'Data refresh completed successfully!',
            'total_articles_fetched': len(all_articles),
            'total_new_articles_added': total_new_articles,
            'before_refresh': before_counts,
            'after_refresh': after_counts,
            'new_articles_by_symbol': new_articles_added,
            'timestamp': datetime.now().isoformat(),
            'api_usage': usage
        })
        
    except Exception as e:
        print(f"Error in refresh data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-text', methods=['POST'])
def analyze_text_sentiment():
    # Keep your existing text analysis endpoint unchanged
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        sentiment = analyze_sentiment_combined(text)
        
        return jsonify({
            'text': text,
            'sentiment': sentiment
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)