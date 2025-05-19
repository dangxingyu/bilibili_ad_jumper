#!/usr/bin/env python3
"""
Bilibili Danmaku Crawler
Crawls danmaku (comments) from a Bilibili video for the past 30 days
"""

import requests
import json
import struct
from datetime import datetime, timedelta
import sys

def get_video_info(bvid):
    """Get video CID from BV ID"""
    url = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
    }
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    if data['code'] == 0:
        return data['data']['cid']
    return None

def parse_danmaku_protobuf(data):
    """Parse danmaku from protobuf format"""
    danmaku_list = []
    offset = 0
    
    while offset < len(data):
        if offset >= len(data):
            break
            
        # Read tag
        tag = data[offset]
        offset += 1
        wire_type = tag & 0x07
        field_number = tag >> 3
        
        if field_number == 1 and wire_type == 2:  # elems field
            # Read length
            length, bytes_read = read_varint(data, offset)
            offset += bytes_read
            
            elem_data = data[offset:offset + length]
            elem = parse_danmaku_elem(elem_data)
            if elem and elem.get('content'):
                danmaku_list.append(elem)
            offset += length
        else:
            # Skip other fields
            offset = skip_field(data, offset, wire_type)
            if offset is None:
                break
                
    return danmaku_list

def parse_danmaku_elem(data):
    """Parse individual danmaku element"""
    elem = {}
    offset = 0
    
    while offset < len(data):
        if offset >= len(data):
            break
            
        tag = data[offset]
        offset += 1
        wire_type = tag & 0x07
        field_number = tag >> 3
        
        if field_number == 2 and wire_type == 0:  # progress field
            value, bytes_read = read_varint(data, offset)
            elem['progress'] = value
            offset += bytes_read
        elif field_number == 7 and wire_type == 2:  # content field
            length, bytes_read = read_varint(data, offset)
            offset += bytes_read
            if length > 0 and offset + length <= len(data):
                elem['content'] = data[offset:offset + length].decode('utf-8', errors='ignore')
            offset += length
        else:
            offset = skip_field(data, offset, wire_type)
            if offset is None:
                break
                
    return elem

def read_varint(data, offset):
    """Read protobuf varint"""
    value = 0
    bytes_read = 0
    
    while True:
        if offset + bytes_read >= len(data):
            break
        byte = data[offset + bytes_read]
        value |= (byte & 0x7F) << (7 * bytes_read)
        bytes_read += 1
        if not (byte & 0x80):
            break
            
    return value, bytes_read

def skip_field(data, offset, wire_type):
    """Skip protobuf field"""
    if wire_type == 0:  # Varint
        while offset < len(data) and (data[offset] & 0x80):
            offset += 1
        return offset + 1 if offset < len(data) else None
    elif wire_type == 1:  # 64-bit
        return offset + 8 if offset + 8 <= len(data) else None
    elif wire_type == 2:  # Length-delimited
        length, bytes_read = read_varint(data, offset)
        return offset + bytes_read + length if offset + bytes_read + length <= len(data) else None
    elif wire_type == 5:  # 32-bit
        return offset + 4 if offset + 4 <= len(data) else None
    else:
        return offset + 1

def fetch_danmaku_by_date(cid, date, sessdata):
    """Fetch danmaku for a specific date"""
    url = f"https://api.bilibili.com/x/v2/dm/web/history/seg.so"
    params = {
        'type': 1,
        'oid': cid,
        'date': date
    }
    headers = {
        'Cookie': f'SESSDATA={sessdata}',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
    }
    
    response = requests.get(url, params=params, headers=headers)
    
    if response.status_code == 200:
        return parse_danmaku_protobuf(response.content)
    return []

def crawl_danmaku(bvid, sessdata, days=30):
    """Crawl danmaku for the past N days"""
    # Get CID from BV ID
    cid = get_video_info(bvid)
    print(f"Video CID: {cid}")
    
    all_danmaku = []
    unique_danmaku = set()
    
    # Fetch danmaku for each day
    today = datetime.now()
    for i in range(days):
        date = today - timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        print(f"Fetching danmaku for {date_str}...")
        
        danmaku_list = fetch_danmaku_by_date(cid, date_str, sessdata)
        
        for item in danmaku_list:
            if 'content' in item and 'progress' in item:
                key = f"{item['progress']}_{item['content']}"
                if key not in unique_danmaku:
                    unique_danmaku.add(key)
                    all_danmaku.append({
                        'time': item['progress'] / 1000,  # Convert to seconds
                        'text': item['content']
                    })
        
        print(f"  Found {len(danmaku_list)} danmaku")
    
    # Sort by time
    all_danmaku.sort(key=lambda x: x['time'])
    
    print(f"\nTotal unique danmaku: {len(all_danmaku)}")
    return all_danmaku

def main():
    # Configuration
    bvid = "BV1234567890"  # Replace with actual BV ID
    sessdata = "your SESSDATA"
    output_file = "danmaku.json"
    
    # Check command line arguments
    if len(sys.argv) > 1:
        bvid = sys.argv[1]
    if len(sys.argv) > 2:
        sessdata = sys.argv[2]
    if len(sys.argv) > 3:
        output_file = sys.argv[3]
    
    print(f"Crawling danmaku for video {bvid}")
    
    # Crawl danmaku
    danmaku_list = crawl_danmaku(bvid, sessdata, 100)
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(danmaku_list, f, ensure_ascii=False, indent=2)
    
    print(f"Danmaku saved to {output_file}")

if __name__ == "__main__":
    main()