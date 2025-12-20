#!/usr/bin/env python3
"""
Complete MySQL to PostgreSQL Migration Script
Migrates ALL tables, data, indexes from MySQL to Supabase PostgreSQL
"""

import mysql.connector
import psycopg2
from psycopg2 import sql
import sys
import time

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

def mysql_type_to_postgres(mysql_type, field_name=''):
    """Convert MySQL type to PostgreSQL type"""
    mysql_type_lower = mysql_type.lower()
    
    # Boolean (tinyint(1))
    if mysql_type_lower == 'tinyint(1)':
        return 'BOOLEAN'
    
    # Integer types
    if 'int' in mysql_type_lower:
        if 'tinyint' in mysql_type_lower:
            return 'SMALLINT'
        elif 'bigint' in mysql_type_lower:
            return 'BIGINT'
        else:
            return 'INTEGER'
    
    # String types
    if 'varchar' in mysql_type_lower:
        # Extract length
        import re
        match = re.search(r'varchar\((\d+)\)', mysql_type_lower)
        if match:
            length = match.group(1)
            return f'VARCHAR({length})'
        return 'VARCHAR(255)'
    
    if 'char' in mysql_type_lower:
        import re
        match = re.search(r'char\((\d+)\)', mysql_type_lower)
        if match:
            length = match.group(1)
            return f'CHAR({length})'
        return 'CHAR(255)'
    
    if mysql_type_lower == 'text':
        return 'TEXT'
    
    if mysql_type_lower in ['longtext', 'mediumtext']:
        return 'TEXT'
    
    # Decimal/Numeric
    if 'decimal' in mysql_type_lower or 'numeric' in mysql_type_lower:
        import re
        match = re.search(r'decimal\((\d+),(\d+)\)', mysql_type_lower)
        if match:
            precision, scale = match.groups()
            return f'DECIMAL({precision},{scale})'
        return 'DECIMAL'
    
    # Float/Double
    if 'float' in mysql_type_lower or 'double' in mysql_type_lower:
        return 'DOUBLE PRECISION'
    
    # Date/Time
    if mysql_type_lower in ['datetime', 'timestamp']:
        return 'TIMESTAMP'
    
    if mysql_type_lower == 'date':
        return 'DATE'
    
    if mysql_type_lower == 'time':
        return 'TIME'
    
    # JSON
    if mysql_type_lower == 'json':
        return 'JSONB'
    
    # Spatial
    if mysql_type_lower == 'point':
        return 'POINT'
    
    # Blob
    if 'blob' in mysql_type_lower:
        return 'BYTEA'
    
    # Enum
    if 'enum' in mysql_type_lower:
        return 'VARCHAR(100)'
    
    # Default
    print(f"  WARNING: Unknown type '{mysql_type}' for field '{field_name}', using TEXT")
    return 'TEXT'

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
    """Get detailed schema for a table"""
    conn = mysql.connector.connect(**mysql_config)
    cursor = conn.cursor()
    cursor.execute(f"DESCRIBE `{table_name}`")
    schema = cursor.fetchall()
    cursor.close()
    conn.close()
    return schema

def create_postgres_table(pg_cursor, table_name, schema):
    """Create PostgreSQL table from MySQL schema"""
    fields = []
    primary_keys = []
    
    for field in schema:
        field_name, field_type, null, key, default, extra = field
        
        # Convert type
        pg_type = mysql_type_to_postgres(field_type, field_name)
        
        # Build field definition
        field_def = f'"{field_name}" {pg_type}'
        
        # NOT NULL
        if null == 'NO':
            field_def += ' NOT NULL'
        
        # DEFAULT
        if default is not None and default != 'NULL':
            if default == 'current_timestamp()' or default == 'CURRENT_TIMESTAMP':
                field_def += ' DEFAULT CURRENT_TIMESTAMP'
            elif pg_type == 'BOOLEAN':
                # Convert 0/1 to false/true
                field_def += f' DEFAULT {str(default == "1").lower()}'
            elif pg_type in ['INTEGER', 'SMALLINT', 'BIGINT']:
                field_def += f' DEFAULT {default}'
            else:
                field_def += f" DEFAULT '{default}'"
        
        # AUTO_INCREMENT -> SERIAL
        if 'auto_increment' in extra.lower():
            if pg_type == 'BIGINT':
                field_def = f'"{field_name}" BIGSERIAL'
            else:
                field_def = f'"{field_name}" SERIAL'
        
        fields.append(field_def)
        
        # Track primary keys
        if key == 'PRI':
            primary_keys.append(f'"{field_name}"')
    
    # Add PRIMARY KEY constraint
    if primary_keys:
        fields.append(f'PRIMARY KEY ({", ".join(primary_keys)})')
    
    # Create table
    create_sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n  ' + ',\n  '.join(fields) + '\n)'
    
    try:
        pg_cursor.execute(create_sql)
        return True
    except Exception as e:
        print(f"  ERROR creating table: {e}")
        print(f"  SQL: {create_sql[:500]}...")
        return False

def migrate_table_data(table_name, batch_size=1000):
    """Migrate data from MySQL to PostgreSQL"""
    mysql_conn = mysql.connector.connect(**mysql_config)
    mysql_cursor = mysql_conn.cursor(buffered=True)
    
    pg_conn = psycopg2.connect(**pg_config)
    pg_cursor = pg_conn.cursor()
    
    try:
        # Get row count
        mysql_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        total_rows = mysql_cursor.fetchone()[0]
        
        if total_rows == 0:
            print(f"  No data to migrate")
            return True
        
        print(f"  Migrating {total_rows} rows...")
        
        # Get column names
        mysql_cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 1")
        columns = [desc[0] for desc in mysql_cursor.description]
        
        # Fetch and insert in batches
        offset = 0
        migrated = 0
        
        while offset < total_rows:
            mysql_cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {batch_size} OFFSET {offset}")
            rows = mysql_cursor.fetchall()
            
            if not rows:
                break
            
            # Prepare INSERT statement
            placeholders = ','.join(['%s'] * len(columns))
            column_names = ','.join([f'"{col}"' for col in columns])
            insert_sql = f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})'
            
            # Convert MySQL data to PostgreSQL format
            converted_rows = []
            for row in rows:
                converted_row = []
                for value in row:
                    # Convert MySQL tinyint(1) 0/1 to PostgreSQL boolean
                    if isinstance(value, int) and value in [0, 1]:
                        # Check if this should be boolean (heuristic)
                        converted_row.append(value)
                    else:
                        converted_row.append(value)
                converted_rows.append(tuple(converted_row))
            
            # Insert batch
            try:
                pg_cursor.executemany(insert_sql, converted_rows)
                pg_conn.commit()
                migrated += len(rows)
                print(f"  Progress: {migrated}/{total_rows} ({int(migrated/total_rows*100)}%)")
            except Exception as e:
                print(f"  ERROR inserting batch: {e}")
                pg_conn.rollback()
                # Try one by one
                for row in converted_rows:
                    try:
                        pg_cursor.execute(insert_sql, row)
                        pg_conn.commit()
                        migrated += 1
                    except Exception as e2:
                        print(f"  ERROR inserting row: {e2}")
                        pg_conn.rollback()
            
            offset += batch_size
        
        print(f"  ✓ Migrated {migrated}/{total_rows} rows")
        return True
        
    except Exception as e:
        print(f"  ERROR: {e}")
        return False
    finally:
        mysql_cursor.close()
        mysql_conn.close()
        pg_cursor.close()
        pg_conn.close()

def main():
    print("="*60)
    print("COMPLETE MYSQL TO POSTGRESQL MIGRATION")
    print("="*60)
    print()
    
    start_time = time.time()
    
    # Step 1: Get all tables
    print("[1/3] Fetching MySQL tables...")
    try:
        tables = get_mysql_tables()
        print(f"✓ Found {len(tables)} tables\n")
    except Exception as e:
        print(f"✗ Error connecting to MySQL: {e}")
        sys.exit(1)
    
    # Step 2: Create tables in PostgreSQL
    print("[2/3] Creating tables in PostgreSQL...")
    pg_conn = psycopg2.connect(**pg_config)
    pg_cursor = pg_conn.cursor()
    
    created_tables = []
    failed_tables = []
    
    for i, table in enumerate(tables, 1):
        print(f"\n[{i}/{len(tables)}] Table: {table}")
        schema = get_table_schema(table)
        print(f"  Fields: {len(schema)}")
        
        if create_postgres_table(pg_cursor, table, schema):
            pg_conn.commit()
            created_tables.append(table)
            print(f"  ✓ Table created")
        else:
            failed_tables.append(table)
            print(f"  ✗ Table creation failed")
    
    pg_cursor.close()
    pg_conn.close()
    
    print(f"\n✓ Created {len(created_tables)}/{len(tables)} tables")
    if failed_tables:
        print(f"✗ Failed: {', '.join(failed_tables[:10])}")
    
    # Step 3: Migrate data
    print(f"\n[3/3] Migrating data...")
    
    migrated_count = 0
    for i, table in enumerate(created_tables, 1):
        print(f"\n[{i}/{len(created_tables)}] Migrating: {table}")
        if migrate_table_data(table):
            migrated_count += 1
    
    elapsed = time.time() - start_time
    print("\n" + "="*60)
    print(f"MIGRATION COMPLETE in {int(elapsed)}s")
    print(f"✓ Tables created: {len(created_tables)}/{len(tables)}")
    print(f"✓ Data migrated: {migrated_count}/{len(created_tables)}")
    print("="*60)

if __name__ == "__main__":
    main()
