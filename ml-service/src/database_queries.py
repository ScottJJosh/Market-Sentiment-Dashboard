# ml-service/src/database_queries.py
import psycopg2
from psycopg2.extras import RealDictCursor
from database import get_db_connection
from datetime import datetime, timedelta

def get_articles_with_sentiment(symbol, days_back=30, limit=50):
    """Get stored articles with sentiment scores for a symbol"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        query = """
        SELECT 
            na.title,
            na.description,
            na.url,
            na.source,
            na.published_at,
            ss.sentiment_score,
            CASE 
                WHEN ss.sentiment_score > 0.1 THEN 'positive'
                WHEN ss.sentiment_score < -0.1 THEN 'negative'
                ELSE 'neutral'
            END as sentiment_classification
        FROM news_articles na
        JOIN article_stock_relations asr ON na.id = asr.article_id
        JOIN stocks s ON asr.stock_id = s.id
        JOIN sentiment_scores ss ON na.id = ss.article_id
        WHERE s.symbol = %s 
        AND na.published_at >= %s
        ORDER BY na.published_at DESC
        LIMIT %s
        """
        
        cursor.execute(query, (symbol, cutoff_date, limit))
        articles = cursor.fetchall()
        
        # Convert to list of dicts for JSON serialization
        return [dict(article) for article in articles]
        
    except Exception as e:
        print(f"Error getting articles for {symbol}: {e}")
        return []
    finally:
        conn.close()

def get_correlation_data(symbol, days_back=90):
    """Get sentiment-price correlation data from database"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        query = """
        WITH daily_sentiment AS (
            SELECT 
                DATE(na.published_at) as news_date,
                AVG(ss.sentiment_score) as avg_sentiment
            FROM news_articles na
            JOIN article_stock_relations asr ON na.id = asr.article_id
            JOIN stocks s ON asr.stock_id = s.id
            JOIN sentiment_scores ss ON na.id = ss.article_id
            WHERE s.symbol = %s 
            AND na.published_at >= %s
            GROUP BY DATE(na.published_at)
        ),
        price_changes AS (
            SELECT 
                sp1.date as trading_date,
                ((sp1.close_price - sp2.close_price) / sp2.close_price) * 100 as price_change
            FROM stock_prices sp1
            JOIN stock_prices sp2 ON sp1.stock_id = sp2.stock_id 
                AND sp2.date = sp1.date - INTERVAL '1 day'
            JOIN stocks s ON sp1.stock_id = s.id
            WHERE s.symbol = %s
            AND sp1.date >= %s
        )
        SELECT 
            ds.news_date::text,
            pc.trading_date::text,
            ds.avg_sentiment as sentiment,
            pc.price_change
        FROM daily_sentiment ds
        JOIN price_changes pc ON ds.news_date = pc.trading_date
        ORDER BY ds.news_date DESC
        """
        
        cursor.execute(query, (symbol, cutoff_date, symbol, cutoff_date))
        correlations = cursor.fetchall()
        
        return [dict(correlation) for correlation in correlations]
        
    except Exception as e:
        print(f"Error getting correlation data for {symbol}: {e}")
        return []
    finally:
        conn.close()

def get_batch_sentiment_summary():
    """Get sentiment summary for all stocks"""
    conn = get_db_connection()
    if not conn:
        return {}
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get recent sentiment (last 7 days)
        query = """
        SELECT 
            s.symbol,
            COUNT(na.id) as articles_found,
            AVG(ss.sentiment_score) as avg_sentiment,
            CASE 
                WHEN AVG(ss.sentiment_score) > 0.1 THEN 'positive'
                WHEN AVG(ss.sentiment_score) < -0.1 THEN 'negative'
                ELSE 'neutral'
            END as classification
        FROM stocks s
        LEFT JOIN article_stock_relations asr ON s.id = asr.stock_id
        LEFT JOIN news_articles na ON asr.article_id = na.id
        LEFT JOIN sentiment_scores ss ON na.id = ss.article_id
        WHERE na.published_at >= NOW() - INTERVAL '7 days'
        GROUP BY s.symbol
        ORDER BY s.symbol
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        batch_data = {}
        for row in results:
            batch_data[row['symbol']] = {
                'articles_found': row['articles_found'] or 0,
                'overall_sentiment': {
                    'score': float(row['avg_sentiment']) if row['avg_sentiment'] else 0,
                    'classification': row['classification'] or 'neutral'
                } if row['avg_sentiment'] else None
            }
        
        return batch_data
        
    except Exception as e:
        print(f"Error getting batch sentiment: {e}")
        return {}
    finally:
        conn.close()

def check_data_freshness(symbol, hours=24):
    """Check if we have fresh data for a symbol"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # Check for recent articles
        cursor.execute("""
            SELECT COUNT(*) 
            FROM news_articles na
            JOIN article_stock_relations asr ON na.id = asr.article_id
            JOIN stocks s ON asr.stock_id = s.id
            WHERE s.symbol = %s 
            AND na.published_at >= %s
        """, (symbol, cutoff_time))
        
        recent_articles = cursor.fetchone()[0]
        
        # Check for recent stock prices
        cursor.execute("""
            SELECT COUNT(*)
            FROM stock_prices sp
            JOIN stocks s ON sp.stock_id = s.id
            WHERE s.symbol = %s
            AND sp.date >= %s
        """, (symbol, cutoff_time.date()))
        
        recent_prices = cursor.fetchone()[0]
        
        return recent_articles > 0 and recent_prices > 0
        
    except Exception as e:
        print(f"Error checking data freshness for {symbol}: {e}")
        return False
    finally:
        conn.close()

def get_api_usage_today():
    """Track API usage to manage limits"""
    conn = get_db_connection()
    if not conn:
        return {'news_calls': 0, 'stock_calls': 0}
    
    try:
        cursor = conn.cursor()
        
        # You'd need to create an api_usage table to track this
        # For now, return estimated usage
        today = datetime.now().date()
        
        # Count articles fetched today (estimate API calls)
        cursor.execute("""
            SELECT COUNT(DISTINCT DATE(created_at))
            FROM news_articles 
            WHERE DATE(created_at) = %s
        """, (today,))
        
        news_calls = cursor.fetchone()[0] or 0
        
        # Count stock price updates today
        cursor.execute("""
            SELECT COUNT(DISTINCT stock_id)
            FROM stock_prices 
            WHERE date = %s
        """, (today,))
        
        stock_calls = cursor.fetchone()[0] or 0
        
        return {
            'news_calls': news_calls,
            'stock_calls': stock_calls,
            'date': today.isoformat()
        }
        
    except Exception as e:
        print(f"Error getting API usage: {e}")
        return {'news_calls': 0, 'stock_calls': 0}
    finally:
        conn.close()

if __name__ == "__main__":
    # Test the functions
    print("Testing database queries...")
    
    # Test article retrieval
    articles = get_articles_with_sentiment('AAPL', days_back=7, limit=10)
    print(f"Found {len(articles)} articles for AAPL")
    
    # Test correlation data
    correlations = get_correlation_data('AAPL', days_back=30)
    print(f"Found {len(correlations)} correlation points for AAPL")
    
    # Test batch sentiment
    batch = get_batch_sentiment_summary()
    print(f"Batch sentiment for {len(batch)} stocks")
    
    # Test freshness
    fresh = check_data_freshness('AAPL', hours=24)
    print(f"AAPL data is {'fresh' if fresh else 'stale'}")
    
    # Test API usage
    usage = get_api_usage_today()
    print(f"API usage today: {usage}")