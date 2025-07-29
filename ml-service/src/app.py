# ml-service/src/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add models directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

# Import your existing functions
from models.Combined_Sentiment import analyze_sentiment_combined
from news_Collection import fetch_headlines, filter_relevant_articles

COMPANY_KEYWORDS = {
    'AAPL': ['Apple', 'iPhone', 'iPad', 'Mac', 'iOS', 'App Store', 'Tim Cook'],
    'GOOGL': ['Google', 'Alphabet', 'YouTube', 'Android', 'Chrome', 'Sundar Pichai'],
    'MSFT': ['Microsoft', 'Windows', 'Azure', 'Office', 'Xbox', 'Satya Nadella'],
    'AMZN': ['Amazon', 'AWS', 'Alexa', 'Prime', 'Jeff Bezos', 'Andy Jassy'],
    'META': ['Meta', 'Facebook', 'Instagram', 'WhatsApp', 'Mark Zuckerberg'],
    'TSLA': ['Tesla', 'Elon Musk', 'Model 3', 'Model Y', 'Cybertruck', 'Supercharger'],
    'NVDA': ['Nvidia', 'GeForce', 'AI chips', 'Jensen Huang', 'RTX']
}


app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        'message': 'TradingEmotion ML Service is running!',
        'version': '1.0.0',
        'endpoints': ['/analyze-sentiment', '/analyze-text']
    })

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_stock_sentiment():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        count = data.get('count', 50)
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        # Fetch news articles
        tech_articles = fetch_headlines('technology', count=count//2)
        business_articles = fetch_headlines('business', count=count//2)
        
        if isinstance(tech_articles, dict) and tech_articles.get('error'):
            return jsonify({'error': f'News API error: {tech_articles["message"]}'}), 500
            
        if isinstance(business_articles, dict) and business_articles.get('error'):
            return jsonify({'error': f'News API error: {business_articles["message"]}'}), 500
        
        all_articles = tech_articles + business_articles
        
        # Filter for the specific company
        filtered_articles = filter_relevant_articles(all_articles, COMPANY_KEYWORDS)
        company_articles = filtered_articles.get(symbol, [])
        
        if not company_articles:
            return jsonify({
                'symbol': symbol,
                'articles_found': 0,
                'sentiment': None,
                'message': f'No relevant articles found for {symbol}'
            })
        
        # Analyze sentiment for each article
        analyzed_articles = []
        sentiment_scores = []
        
        for article in company_articles:
            text = f"{article['title']} {article.get('description', '')}"
            sentiment = analyze_sentiment_combined(text)
            
            analyzed_articles.append({
                'title': article['title'],
                'sentiment_score': sentiment['combined_score'],
                'sentiment_classification': sentiment['classification'],
                'published_at': article.get('publishedAt', article.get('published_at')),
                'url': article.get('url')
            })
            
            sentiment_scores.append(sentiment['combined_score'])
        
        # Calculate overall sentiment
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        
        if avg_sentiment > 0.1:
            overall_classification = 'positive'
        elif avg_sentiment < -0.1:
            overall_classification = 'negative'
        else:
            overall_classification = 'neutral'
        
        return jsonify({
            'symbol': symbol,
            'articles_analyzed': len(analyzed_articles),
            'overall_sentiment': {
                'score': avg_sentiment,
                'classification': overall_classification
            },
            'articles': analyzed_articles
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-text', methods=['POST'])
def analyze_text_sentiment():
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

# ml-service/src/app.py - Add these endpoints to your existing Flask app

@app.route('/analyze-correlation', methods=['POST'])
def analyze_correlation():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        # Import your correlation function
        from stock_sentiment_correlation import correlate_sentiment_with_prices, add_sentiment_to_articles
        from stock_data import fetch_stock_data
        
        # Get news and add sentiment
        tech_articles = fetch_headlines('technology', count=50)
        business_articles = fetch_headlines('business', count=50)
        all_articles = tech_articles + business_articles
        
        filtered_articles = filter_relevant_articles(all_articles, COMPANY_KEYWORDS)
        company_articles = filtered_articles.get(symbol, [])
        
        if not company_articles:
            return jsonify({
                'symbol': symbol,
                'correlation_data': [],
                'message': f'No articles found for correlation analysis of {symbol}'
            })
        
        # Add sentiment scores
        company_articles = add_sentiment_to_articles(company_articles)
        
        # Get stock data
        stock_data = fetch_stock_data(symbol)
        
        if isinstance(stock_data, dict) and stock_data.get('error'):
            return jsonify({'error': f'Stock data error: {stock_data["message"]}'}), 500
        
        # Run correlation analysis
        correlations = correlate_sentiment_with_prices(symbol, company_articles, stock_data)
        
        # Calculate summary stats
        if correlations:
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
        else:
            summary = {
                'total_correlations': 0,
                'message': 'No correlations found'
            }
        
        return jsonify({
            'symbol': symbol,
            'correlation_data': correlations,
            'summary': summary
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-news', methods=['POST'])
def get_filtered_news():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        count = data.get('count', 50)
        
        if not symbol:
            return jsonify({'error': 'Symbol is required'}), 400
        
        # Fetch news articles
        tech_articles = fetch_headlines('technology', count=count//2)
        business_articles = fetch_headlines('business', count=count//2)
        all_articles = tech_articles + business_articles
        
        # Filter for the specific company
        filtered_articles = filter_relevant_articles(all_articles, COMPANY_KEYWORDS)
        company_articles = filtered_articles.get(symbol, [])
        
        return jsonify({
            'symbol': symbol,
            'total_articles_collected': len(all_articles),
            'relevant_articles': len(company_articles),
            'articles': company_articles
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-batch', methods=['POST'])
def analyze_batch_sentiment():
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        count = data.get('count', 25)
        
        if not symbols:
            return jsonify({'error': 'Symbols array is required'}), 400
        
        # Fetch news once for all symbols
        tech_articles = fetch_headlines('technology', count=count)
        business_articles = fetch_headlines('business', count=count)
        all_articles = tech_articles + business_articles
        
        # Filter for all companies
        filtered_articles = filter_relevant_articles(all_articles, COMPANY_KEYWORDS)
        
        results = {}
        
        for symbol in symbols:
            symbol = symbol.upper()
            company_articles = filtered_articles.get(symbol, [])
            
            if company_articles:
                # Analyze sentiment for each article
                sentiment_scores = []
                analyzed_articles = []
                
                for article in company_articles:
                    text = f"{article['title']} {article.get('description', '')}"
                    sentiment = analyze_sentiment_combined(text)
                    sentiment_scores.append(sentiment['combined_score'])
                    
                    analyzed_articles.append({
                        'title': article['title'],
                        'sentiment_score': sentiment['combined_score'],
                        'sentiment_classification': sentiment['classification']
                    })
                
                # Calculate average
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                
                if avg_sentiment > 0.1:
                    overall_classification = 'positive'
                elif avg_sentiment < -0.1:
                    overall_classification = 'negative'
                else:
                    overall_classification = 'neutral'
                
                results[symbol] = {
                    'articles_found': len(company_articles),
                    'overall_sentiment': {
                        'score': avg_sentiment,
                        'classification': overall_classification
                    },
                    'sample_articles': analyzed_articles[:3]  # Just first 3 for batch
                }
            else:
                results[symbol] = {
                    'articles_found': 0,
                    'overall_sentiment': None,
                    'message': f'No articles found for {symbol}'
                }
        
        return jsonify({
            'total_articles_collected': len(all_articles),
            'symbols_analyzed': len(symbols),
            'results': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)