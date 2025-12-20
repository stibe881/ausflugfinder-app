#!/usr/bin/env python3
"""
Data-only migration script
Migrates data from MySQL to existing PostgreSQL tables
"""

import mysql.connector
import psycopg2
import sys
import time

# MySQL Connection
mysql_config = {
    'host': '185.178.193.60',
    'port': 3306,
    'user': 'master',
    'password': '!LeliBist.1561!',
    'database': 'dev_ausflugfinder',
    'use_pure': True  # Use pure Python implementation
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
    """Get list of all tables"""
    conn = mysql.connector.connect(**mysql_config)
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return tables

def migrate_table(table_name, batch_size=500):
    """Migrate data for a single table"""
    # Create separate connections for each table
    mysql_conn = None
    pg_conn = None
    
    try:
        mysql_conn = mysql.connector.connect(**mysql_config)
        mysql_cursor = mysql_conn.cursor()
        
        pg_conn = psycopg2.connect(**pg_config)
        pg_cursor = pg_conn.cursor()
        
        # Get row count
        mysql_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        total_rows = mysql_cursor.fetchone()[0]
        mysql_cursor.fetchall()  # Clear any remaining results
        
        if total_rows == 0:
            print(f"  No data")
            return True, 0
        
        print(f"  Rows: {total_rows}")
        
        # Get column names
        mysql_cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 1")
        columns = [desc[0] for desc in mysql_cursor.description]
        mysql_cursor.fetchall()  # Clear results
        
        # Migrate in batches
        offset = 0
        migrated = 0
        errors = 0
        
        while offset < total_rows:
            # Fetch batch
            mysql_cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {batch_size} OFFSET {offset}")
            rows = mysql_cursor.fetchall()
            
            if not rows:
                break
            
            # Prepare INSERT
            placeholders = ','.join(['%s'] * len(columns))
            column_names = ','.join([f'"{col}"' for col in columns])
            insert_sql = f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
            
            # Insert batch
            for row in rows:
                try:
                    pg_cursor.execute(insert_sql, row)
                    migrated += 1
                except Exception as e:
                    errors += 1
                    if errors <= 3:  # Only print first 3 errors
                        print(f"    Error: {str(e)[:100]}")
            
            pg_conn.commit()
            
            if migrated % 1000 == 0 and migrated > 0:
                print(f"    Progress: {migrated}/{total_rows}")
            
            offset += batch_size
        
        print(f"  ✓ Migrated: {migrated}/{total_rows}" + (f" (errors: {errors})" if errors > 0 else ""))
        return True, migrated
        
    except Exception as e:
        print(f"  ✗ Error: {str(e)[:200]}")
        return False, 0
    finally:
        if mysql_conn:
            try:
                mysql_conn.close()
            except:
                pass
        if pg_conn:
            try:
                pg_conn.close()
            except:
                pass

def main():
    print("="*60)
    print("DATA MIGRATION: MySQL → PostgreSQL")
    print("="*60)
    print()
    
    start_time = time.time()
    
    # Get tables
    print("Fetching tables...")
    tables = get_mysql_tables()
    print(f"Found {len(tables)} tables\n")
    
    # Migrate each table
    total_migrated = 0
    successful = 0
    
    for i, table in enumerate(tables, 1):
        print(f"[{i}/{len(tables)}] {table}")
        success, count = migrate_table(table)
        if success:
            successful += 1
            total_migrated += count
    
    elapsed = time.time() - start_time
    print("\n" + "="*60)
    print(f"COMPLETE in {int(elapsed)}s")
    print(f"✓ Tables: {successful}/{len(tables)}")
    print(f"✓ Total rows migrated: {total_migrated:,}")
    print("="*60)

if __name__ == "__main__":
    main()
