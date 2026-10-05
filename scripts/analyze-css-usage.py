import re, glob, json, os

# Precise CSS-usage analysis.
# Extracts class tokens from:
#   className="a b c"        (static)
#   className={`a ${x?'on':''} b`}   (template — takes literal words + branch literals)
#   className={cond ? 'a' : 'b'}
# and, for dynamic prefixes like `sk-${variant}`, records the literal prefix so
# the corresponding CSS family (sk-line, sk-block, ...) is treated as live.
src_files = [f for f in glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True) if '.test.' not in f]

tokens = set()
dynamic_prefixes = set()

for f in src_files:
    s = open(f, encoding='utf-8').read()
    # className="..." or className='...'
    for m in re.finditer(r'className\s*=\s*["\']([^"\']*)["\']', s):
        tokens.update(m.group(1).split())
    # className={...} — capture the whole brace expression (balanced-ish: up to the matching close)
    for m in re.finditer(r'className\s*=\s*\{', s):
        i = m.end() - 1
        depth = 0
        j = i
        while j < len(s):
            if s[j] == '{':
                depth += 1
            elif s[j] == '}':
                depth -= 1
                if depth == 0:
                    break
            j += 1
        expr = s[i + 1:j]
        # literal class words inside the expression (quoted)
        for q in re.finditer(r'["\'`]([^"\'`]*)["\'`]', expr):
            tokens.update(q.group(1).split())
        # template literal static fragments: `a b ${x}` -> tokens a,b and prefix detection
        for t in re.finditer(r'`([^`]*)`', expr):
            body = t.group(1)
            for frag in re.split(r'\$\{[^}]*\}', body):
                tokens.update(frag.split())
            for pre in re.finditer(r'([A-Za-z][A-Za-z0-9_-]*-\$)\{', body):
                dynamic_prefixes.add(pre.group(1)[:-1])

# remove obvious non-class tokens
tokens = {t for t in tokens if re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]*', t)}
print('source class tokens:', len(tokens))
print('dynamic prefixes:', sorted(dynamic_prefixes))

def classes_in(cssfile):
    return sorted(set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', open(cssfile, encoding='utf-8').read())))

report = {}
for cssfile in ['src/styles.css', 'src/trunk/v3.css', 'src/trunk/ui-v13.css']:
    cls = classes_in(cssfile)
    dead = []
    for c in cls:
        if c in tokens:
            continue
        # live if it matches a dynamic prefix family (sk-line for prefix 'sk-')
        if any(c.startswith(p) for p in dynamic_prefixes):
            continue
        dead.append(c)
    report[cssfile] = {'total': len(cls), 'dead': dead}
    print(f'\n{cssfile}: {len(cls)} classes, {len(dead)} DEAD')
    print('  ', ', '.join(dead))

json.dump(report, open('/tmp/dead-css-report.json', 'w'), indent=2)
