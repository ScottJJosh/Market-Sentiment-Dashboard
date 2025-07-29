from models.Combined_Sentiment import analyze_sentiment_combined
from news_Collection import fetch_headlines, filter_relevant_articles
from stock_data import fetch_stock_data

COMPANY_KEYWORDS = {
    'AAPL': ['Apple', 'iPhone', 'iPad', 'Mac', 'iOS', 'App Store', 'Tim Cook'],
    'GOOGL': ['Google', 'Alphabet', 'YouTube', 'Android', 'Chrome', 'Sundar Pichai'],
    'MSFT': ['Microsoft', 'Windows', 'Azure', 'Office', 'Xbox', 'Satya Nadella'],
    'AMZN': ['Amazon', 'AWS', 'Alexa', 'Prime', 'Jeff Bezos', 'Andy Jassy'],
    'META': ['Meta', 'Facebook', 'Instagram', 'WhatsApp', 'Mark Zuckerberg'],
    'TSLA': ['Tesla', 'Elon Musk', 'Model 3', 'Model Y', 'Cybertruck', 'Supercharger'],
    'NVDA': ['Nvidia', 'GeForce', 'AI chips', 'Jensen Huang', 'RTX']
}

def correlate_sentiment_with_prices(symbol, sentiment_data, stock_data):
    """
    Correlate same-day sentiment with same-day price percentage change
    (handles weekends/holidays by finding next trading day)
    """
    from datetime import datetime, timedelta
    
    def get_next_trading_day(date_str, stock_dates):
        """Find the next available trading day for a given date"""
        news_date = datetime.strptime(date_str, '%Y-%m-%d')
        
        # Look for the next trading day (could be the same day if it's a trading day)
        for i in range(7):  # Look up to 7 days ahead
            check_date = (news_date + timedelta(days=i)).strftime('%Y-%m-%d')
            if check_date in stock_dates:
                return check_date
        
        # Look backwards if no future trading day found
        for i in range(1, 7):
            check_date = (news_date - timedelta(days=i)).strftime('%Y-%m-%d')
            if check_date in stock_dates:
                return check_date
        
        return None
    
    # Step 1: Group sentiment by date
    daily_sentiment = {}
    
    for article in sentiment_data:
        if article.get('publishedAt'):
            date_str = article['publishedAt'][:10]
            
            if date_str not in daily_sentiment:
                daily_sentiment[date_str] = []
            
            sentiment_score = article.get('sentiment_score', 0)
            daily_sentiment[date_str].append(sentiment_score)
    
    # Calculate daily averages
    for date in daily_sentiment:
        scores = daily_sentiment[date]
        daily_sentiment[date] = sum(scores) / len(scores)
    
    # Step 2: Calculate daily price percentage changes
    daily_price_changes = {}
    stock_dates = set()
    
    for i in range(1, len(stock_data)):
        today = stock_data[i]
        yesterday = stock_data[i-1]
        
        today_close = today['close']
        yesterday_close = yesterday['close']
        
        percentage_change = ((today_close - yesterday_close) / yesterday_close) * 100
        daily_price_changes[today['date']] = percentage_change
        stock_dates.add(today['date'])
    
    # Step 3: Find correlations (with weekend handling)
    correlations = []
    
    for news_date in daily_sentiment:
        # Find the corresponding trading day
        trading_day = get_next_trading_day(news_date, stock_dates)
        
        if trading_day and trading_day in daily_price_changes:
            correlations.append({
                'news_date': news_date,
                'trading_date': trading_day,
                'sentiment': daily_sentiment[news_date],
                'price_change': daily_price_changes[trading_day]
            })
    
    return correlations

def add_sentiment_to_articles(articles):
    """
    Add sentiment analysis to your filtered articles
    """
    for article in articles:
        text = f"{article['title']} {article.get('description', '')}"
        sentiment = analyze_sentiment_combined(text)  # Your combined VADER+TextBlob function
        article['sentiment_score'] = sentiment['combined_score']
        article['sentiment_classification'] = sentiment['classification']
    return articles

def get_next_trading_day(date_str, stock_dates):
    """
    Find the next available trading day for a given date
    """
    # Convert to date for comparison
    from datetime import datetime, timedelta
    
    news_date = datetime.strptime(date_str, '%Y-%m-%d')
    
    # Look for the next trading day (could be the same day if it's a trading day)
    for i in range(7):  # Look up to 7 days ahead
        check_date = (news_date + timedelta(days=i)).strftime('%Y-%m-%d')
        if check_date in stock_dates:
            return check_date
    
    # Look backwards if no future trading day found
    for i in range(1, 7):
        check_date = (news_date - timedelta(days=i)).strftime('%Y-%m-%d')
        if check_date in stock_dates:
            return check_date
    
    return None

def test_full_correlation():
    print("=== Sentiment-Price Correlation Test ===\n")
    
    # Step 1: Get some recent articles
    tech_articles = fetch_headlines('technology', count=50)
    business_articles = fetch_headlines('business', count=50)
    all_articles = tech_articles + business_articles
    
    filtered_articles = filter_relevant_articles(all_articles, COMPANY_KEYWORDS)
    
    # Step 2: Add sentiment scores
    total_articles_analyzed = 0
    for symbol in filtered_articles:
        if filtered_articles[symbol]:
            filtered_articles[symbol] = add_sentiment_to_articles(filtered_articles[symbol])
            total_articles_analyzed += len(filtered_articles[symbol])
    
    print(f"Total articles collected: {len(all_articles)}")
    print(f"Total relevant articles: {total_articles_analyzed}")
    
    # Step 3: Test correlation for each company
    for symbol in ['AAPL', 'GOOGL', 'MSFT']:  # Test top 3
        if filtered_articles[symbol]:
            print(f"\n--- {symbol} Correlation Analysis ---")
            
            # Get stock data
            stock_data = fetch_stock_data(symbol)
            
            if not isinstance(stock_data, dict) or not stock_data.get('error'):
                correlations = correlate_sentiment_with_prices(symbol, filtered_articles[symbol], stock_data)
                
                # Calculate stats
                articles_used = len(filtered_articles[symbol])
                days_with_sentiment = len(set(article['publishedAt'][:10] for article in filtered_articles[symbol] if article.get('publishedAt')))
                total_trading_days = len(stock_data) - 1  # -1 because we can't calculate change for first day
                days_correlated = len(correlations)
                
                print(f"Articles about {symbol}: {articles_used}")
                print(f"Days with sentiment data: {days_with_sentiment}")
                print(f"Total trading days available: {total_trading_days}")
                print(f"Days successfully correlated: {days_correlated}")
                print(f"Correlation coverage: {(days_correlated/total_trading_days)*100:.1f}%")
                
                # In test_full_correlation(), update the sample correlations print:
                if correlations:
                    print("\nSample correlations (last 3 days):")
                    for correlation in correlations[-3:]:
                        print(f"  News: {correlation['news_date']} → Trading: {correlation['trading_date']}")
                        print(f"    Sentiment: {correlation['sentiment']:.3f}, Price: {correlation['price_change']:.2f}%")
                
                # Quick correlation strength check
                if len(correlations) >= 5:
                    sentiments = [c['sentiment'] for c in correlations]
                    price_changes = [c['price_change'] for c in correlations]
                    
                    # Simple correlation check
                    positive_sentiment_days = [c for c in correlations if c['sentiment'] > 0.1]
                    negative_sentiment_days = [c for c in correlations if c['sentiment'] < -0.1]
                    
                    if positive_sentiment_days:
                        avg_positive_price_change = sum(c['price_change'] for c in positive_sentiment_days) / len(positive_sentiment_days)
                        print(f"\nAverage price change on positive sentiment days: {avg_positive_price_change:.2f}%")
                    
                    if negative_sentiment_days:
                        avg_negative_price_change = sum(c['price_change'] for c in negative_sentiment_days) / len(negative_sentiment_days)
                        print(f"Average price change on negative sentiment days: {avg_negative_price_change:.2f}%")


    """See exactly what dates are being compared"""
    
    tech_articles = fetch_headlines('technology', count=10)
    filtered_articles = filter_relevant_articles(tech_articles, COMPANY_KEYWORDS)
    
    # Add sentiment to Apple articles
    if filtered_articles['AAPL']:
        filtered_articles['AAPL'] = add_sentiment_to_articles(filtered_articles['AAPL'])
        
        # Get stock data
        stock_data = fetch_stock_data('AAPL')
        
        # Run the correlation function but add debug prints
        print("=== Correlation Debug ===")
        
        # Check what dates we have from news
        daily_sentiment = {}
        for article in filtered_articles['AAPL']:
            if article.get('publishedAt'):
                date_str = article['publishedAt'][:10]
                if date_str not in daily_sentiment:
                    daily_sentiment[date_str] = []
                daily_sentiment[date_str].append(article.get('sentiment_score', 0))
        
        print("News dates with sentiment:")
        for date in daily_sentiment:
            print(f"  {date}")
        
        # Check what dates we have from stock
        daily_price_changes = {}
        for i in range(1, min(10, len(stock_data))):  # Just check first 10
            today = stock_data[i]
            daily_price_changes[today['date']] = 0  # dummy value
        
        print("\nStock dates (recent 10):")
        for date in list(daily_price_changes.keys())[:10]:
            print(f"  {date}")
        
        # Check for matches
        print("\nMatching dates:")
        for date in daily_sentiment:
            if date in daily_price_changes:
                print(f"  MATCH: {date}")
            else:
                print(f"  NO MATCH: {date}")

if __name__ == "__main__":
    # debug_correlation_matching()
    test_full_correlation()
    