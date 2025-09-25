-- Add the bet_limits_per_draw table
CREATE TABLE IF NOT EXISTS bet_limits_per_draw (
    id SERIAL PRIMARY KEY,
    draw_id INT NOT NULL,
    bet_combination VARCHAR(3) NOT NULL,
    bet_type bet_type NOT NULL,
    limit_amount NUMERIC(12,2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INT,
    CONSTRAINT fk_bet_limit_draw FOREIGN KEY (draw_id) REFERENCES draws(id),
    CONSTRAINT fk_bet_limit_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bet_limits_draw ON bet_limits_per_draw(draw_id);
CREATE INDEX IF NOT EXISTS idx_bet_limits_combination ON bet_limits_per_draw(bet_combination);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE bet_limits_per_draw TO postgres;