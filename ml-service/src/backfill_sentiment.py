# ml-service/src/backfill_sentiment.py
from database import get_db_connection, save_sentiment_score
from models.Combined_Sentiment import analyze_sentiment_combined

def backfill_missing_sentiment():
    """Analyze sentiment for articles that don't have sentiment scores yet"""
    conn = get_db_connection()
    if not conn:
        print("Cannot connect to database!")
        return
    
    try:
        cursor = conn.cursor()
        
        # Find articles without sentiment scores
        query = """
        SELECT 
            na.id as article_id,
            na.title,
            na.description,
            s.id as stock_id,
            s.symbol
        FROM news_articles na
        JOIN article_stock_relations asr ON na.id = asr.article_id
        JOIN stocks s ON asr.stock_id = s.id
        LEFT JOIN sentiment_scores ss ON na.id = ss.article_id AND s.id = ss.stock_id
        WHERE ss.id IS NULL
        ORDER BY s.symbol, na.published_at DESC
        """
        
        cursor.execute(query)
        missing_articles = cursor.fetchall()
        
        print(f"Found {len(missing_articles)} articles without sentiment analysis")
        
        if len(missing_articles) == 0:
            print("✅ All articles already have sentiment analysis!")
            return
        
        # Process each missing article
        processed = 0
        by_symbol = {}
        
        for article_id, title, description, stock_id, symbol in missing_articles:
            if symbol not in by_symbol:
                by_symbol[symbol] = 0
            
            # Combine title and description for analysis
            text = f"{title or ''} {description or ''}"
            
            if not text.strip():
                print(f"⚠️  Skipping article with no text: {article_id}")
                continue
            
            try:
                # Analyze sentiment
                sentiment_result = analyze_sentiment_combined(text)
                sentiment_score = sentiment_result['combined_score']
                
                # Save sentiment score
                sentiment_id = save_sentiment_score(
                    article_id,
                    stock_id,
                    sentiment_score
                )
                
                if sentiment_id:
                    processed += 1
                    by_symbol[symbol] += 1
                    print(f"✅ {symbol}: Added sentiment for '{title[:50]}...' (Score: {sentiment_score:.3f})")
                else:
                    print(f"❌ Failed to save sentiment for article {article_id}")
                    
            except Exception as e:
                print(f"❌ Error analyzing article {article_id}: {e}")
        
        print(f"\n=== BACKFILL COMPLETE ===")
        print(f"Processed {processed} articles")
        print("Articles added by symbol:")
        for symbol, count in by_symbol.items():
            print(f"  {symbol}: +{count} sentiment scores")
            
    except Exception as e:
        print(f"Error in backfill: {e}")
    finally:
        conn.close()

def check_sentiment_coverage():
    """Check how many articles have sentiment analysis"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        query = """
        SELECT 
            s.symbol,
            COUNT(asr.article_id) as total_articles,
            COUNT(ss.id) as articles_with_sentiment,
            ROUND(
                (COUNT(ss.id) * 100.0 / NULLIF(COUNT(asr.article_id), 0)), 2
            ) as coverage_percent
        FROM stocks s 
        LEFT JOIN article_stock_relations asr ON s.id = asr.stock_id
        LEFT JOIN sentiment_scores ss ON asr.article_id = ss.article_id
        GROUP BY s.symbol
        ORDER BY s.symbol
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        print("=== SENTIMENT COVERAGE REPORT ===")
        print("Symbol | Total Articles | With Sentiment | Coverage %")
        print("-------|----------------|----------------|----------")
        
        for symbol, total, with_sentiment, coverage in results:
            print(f"{symbol:6} | {total:14} | {with_sentiment:14} | {coverage or 0:8}%")
            
    except Exception as e:
        print(f"Error checking coverage: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== SENTIMENT BACKFILL UTILITY ===\n")
    
    # First, check current coverage
    check_sentiment_coverage()
    
    print("\n" + "="*50 + "\n")
    
    # Then backfill missing sentiment
    backfill_missing_sentiment()
    
    print("\n" + "="*50 + "\n")
    
    # Finally, check coverage again
    print("After backfill:")
    check_sentiment_coverage()