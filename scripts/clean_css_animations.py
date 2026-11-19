# PATH: scripts/clean_css_animations.py
import glob
import re

archetype_files = glob.glob('frontend/src/remotion/archetypes/*.tsx')
for path in archetype_files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    content = re.sub(r'\banimate-pulse\b', '', content)
    content = re.sub(r'\banimate-ping\b', '', content)
    content = re.sub(r'\btransition-all\b', '', content)
    content = re.sub(r'className="([^"]*)"', lambda m: 'className="' + ' '.join(m.group(1).split()) + '"', content)
    if content != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Cleaned CSS animations from:', path)
