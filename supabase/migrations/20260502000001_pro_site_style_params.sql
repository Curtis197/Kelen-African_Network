-- Extend professional_portfolio with image_weight and spacing columns
-- and allow 'warm' as a valid color_mode value

ALTER TABLE professional_portfolio
  ADD COLUMN IF NOT EXISTS image_weight TEXT NOT NULL DEFAULT 'balanced'
    CHECK (image_weight IN ('image', 'balanced', 'text')),
  ADD COLUMN IF NOT EXISTS spacing TEXT NOT NULL DEFAULT 'standard'
    CHECK (spacing IN ('spacious', 'standard', 'compact'));

-- Widen the color_mode constraint to include 'warm'
ALTER TABLE professional_portfolio
  DROP CONSTRAINT IF EXISTS professional_portfolio_color_mode_check;

ALTER TABLE professional_portfolio
  ADD CONSTRAINT professional_portfolio_color_mode_check
    CHECK (color_mode IN ('light', 'dark', 'logo-color', 'warm'));
