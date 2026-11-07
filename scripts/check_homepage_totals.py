#!/usr/bin/env python3
"""Check that homepage topic counts match the generated catalog source."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

from build_topic_catalog import build_catalog

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ('math', 'physics', 'chemistry', 'science')


class Cards(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cards = []
        self.card = None
        self.badge_open = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if tag == 'a' and 'subject-card' in classes:
            self.card = {'subject': None, 'total': None, 'badge': ''}
        elif self.card is not None:
            if tag == 'div' and 'subject-progress' in classes:
                self.card['subject'] = attrs.get('data-subject')
                self.card['total'] = attrs.get('data-total')
            if tag == 'span' and 'subject-badge' in classes:
                self.badge_open = True

    def handle_data(self, data):
        if self.card is not None and self.badge_open:
            self.card['badge'] += data

    def handle_endtag(self, tag):
        if tag == 'span':
            self.badge_open = False
        if tag == 'a' and self.card is not None:
            self.cards.append(self.card)
            self.card = None


def check(html, counts):
    parser = Cards()
    parser.feed(html)
    errors = []
    seen = set()
    for card in parser.cards:
        subject = card['subject']
        if subject not in SUBJECTS or subject in seen:
            errors.append(f'unknown or duplicate subject card: {subject}')
            continue
        seen.add(subject)
        expected = counts.get(subject, 0)
        if expected <= 0:
            errors.append(f'{subject}: no topics in catalog')
        if card['total'] != str(expected):
            errors.append(f'{subject}: progress total {card["total"]!r}, catalog {expected}')
        if not re.fullmatch(rf'\s*{expected}\s*个知识点\s*', card['badge']):
            errors.append(f'{subject}: badge {card["badge"]!r}, catalog {expected}')
    for subject in SUBJECTS:
        if subject not in seen:
            errors.append(f'{subject}: subject card missing')
    return errors


def main():
    counts = Counter(item['subject'] for item in build_catalog(ROOT))
    errors = check((ROOT / 'index.html').read_text(encoding='utf-8'), counts)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('Homepage subject totals match topic catalog')
    return 0


if __name__ == '__main__':
    sys.exit(main())
