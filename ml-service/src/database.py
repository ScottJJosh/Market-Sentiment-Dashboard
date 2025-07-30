# ml-service/src/database.py
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime
from urllib.parse import urlparse

def get_db_connection():
    """Create database connection"""
    try:
        print("Attempting to connect to database...")
        
        # Try to get connection details from DATABASE_URL environment variable first
        database_url = os.getenv('DATABASE_URL')
        
        if database_url:
            # Parse the DATABASE_URL
            url = urlparse(database_url)
            host = url.hostname
            database = url.path[1:]  # Remove leading slash
            user = url.username
            password = url.password
            port = url.port or 5432
        else:
            # Fallback to individual environment variables or defaults
            # Check if we're running in Docker (hostname 'db' exists) or locally
            default_host = 'db'
            try:
                import socket
                socket.gethostbyname('db')
            except socket.gaierror:
                # 'db' hostname not found, likely running locally
                default_host = 'localhost'
            
            host = os.getenv('DB_HOST', default_host)
            database = os.getenv('DB_NAME', 'sentiment_db')
            user = os.getenv('DB_USER', 'postgres')
            password = os.getenv('DB_PASSWORD', 'password')
            port = os.getenv('DB_PORT', '5432')
        
        print(f"Host: {host}, Database: {database}, User: {user}, Port: {port}")
        
        conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password,
            port=port
        )
        print("Database connection successful!")
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        print(f"Error type: {type(e)}")
        return None

def save_article(article, stock_symbols=None):
    """Save news article to database"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        # Insert article
        insert_query = """
        INSERT INTO news_articles (title, description, content, url, url_to_image, source, author, published_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (url) DO NOTHING
        RETURNING id;
        """
        
        published_at = None
        if article.get('publishedAt'):
            published_at = datetime.fromisoformat(article['publishedAt'].replace('Z', '+00:00'))
        
        cursor.execute(insert_query, (
            article.get('title'),
            article.get('description'),
            article.get('content'),
            article.get('url'),
            article.get('urlToImage'),
            article.get('source'),
            article.get('author'),
            published_at
        ))
        
        result = cursor.fetchone()
        article_id = result[0] if result else None
        
        # Link to stocks if provided
        if article_id and stock_symbols:
            for symbol in stock_symbols:
                # Get stock_id
                cursor.execute("SELECT id FROM stocks WHERE symbol = %s", (symbol,))
                stock_result = cursor.fetchone()
                
                if stock_result:
                    stock_id = stock_result[0]
                    
                    # Insert relationship
                    cursor.execute("""
                        INSERT INTO article_stock_relations (article_id, stock_id)
                        VALUES (%s, %s)
                        ON CONFLICT (article_id, stock_id) DO NOTHING
                    """, (article_id, stock_id))
        
        conn.commit()
        return article_id
        
    except Exception as e:
        print(f"Error saving article: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def save_stock_prices(symbol, stock_data):
    """Save stock price data to database"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Get stock_id
        cursor.execute("SELECT id FROM stocks WHERE symbol = %s", (symbol,))
        stock_result = cursor.fetchone()
        
        if not stock_result:
            print(f"Stock {symbol} not found in database")
            return False
        
        stock_id = stock_result[0]
        
        # Insert stock prices
        for day in stock_data:
            cursor.execute("""
                INSERT INTO stock_prices (stock_id, date, close_price)
                VALUES (%s, %s, %s)
                ON CONFLICT (stock_id, date) DO UPDATE SET close_price = EXCLUDED.close_price
            """, (stock_id, day['date'], day['close']))
        
        conn.commit()
        print(f"Saved {len(stock_data)} price records for {symbol}")
        return True
        
    except Exception as e:
        print(f"Error saving stock prices: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def save_sentiment_score(article_id, stock_id, sentiment_score, confidence=None):
    """Save sentiment score to database"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO sentiment_scores (article_id, stock_id, sentiment_score, confidence)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
        """, (article_id, stock_id, sentiment_score, confidence))
        
        result = cursor.fetchone()
        sentiment_id = result[0] if result else None
        
        conn.commit()
        return sentiment_id
        
    except Exception as e:
        print(f"Error saving sentiment score: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def test_db_connection():
    """Test database connection and show available stocks"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM stocks")
        stocks = cursor.fetchall()
        
        print("Database connection successful!")
        print("Available stocks:")
        for stock in stocks:
            print(f"  {stock['symbol']}: {stock['name']}")
        
        return True
        
    except Exception as e:
        print(f"Database test error: {e}")
        return False
    finally:
        conn.close()


    return False

if __name__ == "__main__":
    # Test the database connection with retries
    if test_db_connection():
        print("Database is ready for use.")
    else:
        print("Failed to connect to the database.")