-- Create database tables
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated news_articles table with your actual fields
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url VARCHAR(512),
    url_to_image VARCHAR(512),
    source VARCHAR(100),
    author VARCHAR(255),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table for your stock price data
CREATE TABLE IF NOT EXISTS stock_prices (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id),
    date DATE NOT NULL,
    close_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, date)
);

-- Junction table for articles that mention multiple companies
CREATE TABLE IF NOT EXISTS article_stock_relations (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id),
    stock_id INTEGER REFERENCES stocks(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, stock_id)
);

CREATE TABLE IF NOT EXISTS sentiment_scores (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id),
    stock_id INTEGER REFERENCES stocks(id),
    sentiment_score DECIMAL(5,4),
    confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_sentiment_scores_stock_created ON sentiment_scores(stock_id, created_at);
CREATE INDEX idx_news_published ON news_articles(published_at);
CREATE INDEX idx_stock_prices_date ON stock_prices(stock_id, date);
CREATE INDEX idx_article_stock_relations ON article_stock_relations(stock_id, article_id);