#!/usr/bin/env python3
"""
MySQL to PostgreSQL Migration Script
Migrates data from Original-Webapp MySQL DB to Supabase PostgreSQL
"""

import mysql.connector
import psycopg2
import sys

# MySQL Connection
mysql_config = {
    'host': '185.178.193.60',
    'port': 3306,
    'user': 'master',
    'password': '!LeliBist.1561!',
    'database': 'dev_ausflugfinder'
}

# PostgreSQL Connection
pg_config = {
    'host': 'aws-1-eu-west-2.pooler.supabase.com',
    'port': 6543,
    'user': 'postgres.iopejcjkmuievlaclecn',
    'password': '!LeliBist.1561!',
    'database': 'postgres'
}

def get_mysql_tables():
    """Get list of all tables from MySQL"""
    conn = mysql.connector.connect(**mysql_config)
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return tables

def get_table_schema(table_name):
    """Get schema for a specific table"""
    conn = mysql.connector.connect(**mysql_config)
    cursor = conn.cursor()
    cursor.execute(f"DESCRIBE {table_name}")
    schema = cursor.fetchall()
    cursor.close()
    conn.close()
    return schema

def mysql_type_to_postgres(mysql_type):
    """Convert MySQL type to PostgreSQL type"""
    mysql_type = mysql_type.lower()
    
    # Integer types
    if 'int' in mysql_type:
        if 'tiny' in mysql_type:
            return 'SMALLINT'
        elif 'big' in mysql_type:
            return 'BIGINT'
        else:
            return 'INTEGER'
    
    # String types
    if 'varchar' in mysql_type or 'char' in mysql_type:
        return mysql_type.upper().replace('VARCHAR', 'VARCHAR')
    
    if mysql_type == 'text':
        return 'TEXT'
    
    if mysql_type == 'longtext' or mysql_type == 'mediumtext':
        return 'TEXT'
    
    # Decimal/Numeric
    if 'decimal' in mysql_type or 'numeric' in mysql_type:
        return mysql_type.upper()
    
    # Date/Time
    if mysql_type == 'datetime' or mysql_type == 'timestamp':
        return 'TIMESTAMP'
    
    if mysql_type == 'date':
        return 'DATE'
    
    if mysql_type == 'time':
        return 'TIME'
    
    # Boolean
    if 'tinyint(1)' in mysql_type:
        return 'BOOLEAN'
    
    # JSON
    if mysql_type == 'json':
        return 'JSONB'
    
    # Spatial
    if mysql_type == 'point':
        return 'POINT'
    
    # Default
    return 'TEXT'

def main():
    print("=== MySQL to PostgreSQL Migration ===\n")
    
    # Step 1: Get all tables
    print("Step 1: Fetching MySQL tables...")
    try:
        tables = get_mysql_tables()
        print(f"Found {len(tables)} tables\n")
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        sys.exit(1)
    
    # Step 2: Analyze first 5 tables as example
    print("Step 2: Analyzing table schemas (first 10)...")
    for i, table in enumerate(tables[:10]):
        print(f"\n{i+1}. Table: {table}")
        schema = get_table_schema(table)
        print(f"   Fields: {len(schema)}")
        for field in schema[:5]:  # Show first 5 fields
            field_name, field_type = field[0], field[1]
            pg_type = mysql_type_to_postgres(field_type)
            print(f"   - {field_name}: {field_type} → {pg_type}")
        if len(schema) > 5:
            print(f"   ... and {len(schema) - 5} more fields")
    
    print("\n\nMigration script ready. Run with --execute to perform migration.")

if __name__ == "__main__":
    main()
