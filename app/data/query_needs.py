#!/usr/bin/env python3
"""
医美需求方案快速查询工具
用法: python3 query_needs.py [需求关键词]
示例: python3 query_needs.py 祛斑
"""

import json
import sys

def load_data():
    with open('/root/claude/cqbcc-service/app/data/needs-mapping.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def search_needs(keyword):
    data = load_data()
    results = []
    
    for need in data['needs']:
        # 在名称和关键词中搜索
        if (keyword in need['name'] or 
            any(keyword in kw for kw in need['keywords']) or
            any(keyword in prob for prob in need['target_problems'])):
            results.append(need)
    
    return results

def display_need(need):
    print(f"\n{'='*80}")
    print(f"需求: {need['name']}")
    print(f"{'='*80}")
    print(f"\n适用问题: {', '.join(need['target_problems'])}")
    
    print(f"\n推荐项目:")
    for i, proj in enumerate(need['recommended_projects'], 1):
        priority = '🔥' if proj['priority'] == 'high' else '⭐'
        print(f"  {i}. {priority} {proj['project_name']}")
        print(f"     理由: {proj['reason']}")
    
    print(f"\n方案对比:")
    for plan in need['plans']:
        level_map = {'basic': '基础', 'standard': '标准', 'premium': '高级'}
        print(f"\n  【{level_map[plan['level']]}方案】 ¥{plan['price_range']}")
        print(f"    项目: {', '.join(plan['projects'])}")
        print(f"    疗程: {plan['sessions']}, {plan['duration']}")
        print(f"    适合: {plan['suitable_for']}")

def main():
    if len(sys.argv) < 2:
        print("请提供搜索关键词")
        print("示例: python3 query_needs.py 祛斑")
        print("\n可用关键词:")
        data = load_data()
        for need in data['needs']:
            print(f"  - {need['name']}: {', '.join(need['keywords'][:3])}")
        return
    
    keyword = sys.argv[1]
    results = search_needs(keyword)
    
    if not results:
        print(f"未找到与 '{keyword}' 相关的需求")
        return
    
    print(f"\n找到 {len(results)} 个相关需求:")
    for need in results:
        display_need(need)

if __name__ == '__main__':
    main()
