# ml-service/src/init_db.py
import psycopg2
from database import get_db_connection

def create_tables():
    """Create all necessary database tables"""
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create stocks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stocks (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(10) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create news_articles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS news_articles (
                id SERIAL PRIMARY KEY,
                title TEXT,
                description TEXT,
                content TEXT,
                url TEXT UNIQUE,
                url_to_image TEXT,
                source VARCHAR(255),
                author VARCHAR(255),
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create stock_prices table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_prices (
                id SERIAL PRIMARY KEY,
                stock_id INTEGER REFERENCES stocks(id),
                date DATE NOT NULL,
                close_price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(stock_id, date)
            );
        """)
        
        # Create article_stock_relations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS article_stock_relations (
                id SERIAL PRIMARY KEY,
                article_id INTEGER REFERENCES news_articles(id),
                stock_id INTEGER REFERENCES stocks(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(article_id, stock_id)
            );
        """)
        
        # Create sentiment_scores table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sentiment_scores (
                id SERIAL PRIMARY KEY,
                article_id INTEGER REFERENCES news_articles(id),
                stock_id INTEGER REFERENCES stocks(id),
                sentiment_score DECIMAL(5, 4) NOT NULL,
                confidence DECIMAL(5, 4),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        print("✅ All tables created successfully!")
        
        # Insert some sample stock data
        sample_stocks = [
            ('AAPL', 'Apple Inc.'),
            ('GOOGL', 'Alphabet Inc.'),
            ('MSFT', 'Microsoft Corporation'),
            ('AMZN', 'Amazon.com Inc.'),
            ('TSLA', 'Tesla Inc.'),
            ('META', 'Meta Platforms Inc.'),
            ('NVDA', 'NVIDIA Corporation'),
            ('NFLX', 'Netflix Inc.')
        ]
        
        for symbol, name in sample_stocks:
            cursor.execute("""
                INSERT INTO stocks (symbol, name) 
                VALUES (%s, %s) 
                ON CONFLICT (symbol) DO NOTHING
            """, (symbol, name))
        
        conn.commit()
        print("✅ Sample stock data inserted!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    if create_tables():
        print("🎉 Database initialization completed successfully!")
    else:
        print("💥 Database initialization failed!")