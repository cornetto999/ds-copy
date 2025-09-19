-- Migration script to add performance tracking fields to teachers table
-- Run this script to update existing database

USE school_db;

-- Add performance tracking columns to teachers table
ALTER TABLE teachers 
ADD COLUMN p1_failed INT DEFAULT 0 AFTER failure_percentage,
ADD COLUMN p1_percent DECIMAL(5,2) DEFAULT 0.00 AFTER p1_failed,
ADD COLUMN p1_category VARCHAR(50) DEFAULT 'GREEN (0.01%-10%)' AFTER p1_percent,
ADD COLUMN p2_failed INT DEFAULT 0 AFTER p1_category,
ADD COLUMN p2_percent DECIMAL(5,2) DEFAULT 0.00 AFTER p2_failed,
ADD COLUMN p2_category VARCHAR(50) DEFAULT 'GREEN (0.01%-10%)' AFTER p2_percent;

-- Update existing records to have default values
UPDATE teachers SET 
    p1_failed = 0,
    p1_percent = 0.00,
    p1_category = 'GREEN (0.01%-10%)',
    p2_failed = 0,
    p2_percent = 0.00,
    p2_category = 'GREEN (0.01%-10%)'
WHERE p1_failed IS NULL;
