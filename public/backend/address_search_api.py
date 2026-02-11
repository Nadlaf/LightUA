import re
from pathlib import Path
from typing import Optional, List, Dict
from difflib import SequenceMatcher
from pypdf import PdfReader

from parse_queue_addresses import (
    _clean_text,
    _find_queue_label,
    _normalize_text,
)


class AddressSearchEngine:
    
    def __init__(self, pdf_dir: str):
        self.pdf_dir = Path(pdf_dir)
        self.cache: Dict[str, Dict] = {}
        self._load_pdfs()
    
    def _load_pdfs(self):
        print(f"Завантаження PDF файлів з {self.pdf_dir}...")
        
        pdf_files = sorted(self.pdf_dir.glob("*.pdf"))
        for pdf_path in pdf_files:
            try:
                reader = PdfReader(str(pdf_path))
                queue_label, queue_code = _find_queue_label(reader)
                
                pages_text = [page.extract_text() or "" for page in reader.pages]
                full_text = "\n".join(pages_text)
                cleaned_text = _clean_text(full_text)
                raw_lines = []
                for page_text in pages_text:
                    raw_lines.extend([line.strip() for line in page_text.splitlines() if line.strip()])
                
                self.cache[pdf_path.name] = {
                    "queue_label": queue_label,
                    "queue": queue_code,
                    "text": cleaned_text,
                    "lines": raw_lines,
                }
                
                print(f"  ✓ {pdf_path.name} - Черга {queue_code}")
            except Exception as e:
                print(f"  ✗ Помилка при читанні {pdf_path.name}: {e}")
        
        print(f"Завантажено {len(self.cache)} PDF файлів")
    
    def _normalize_address(self, address: str) -> str:
        addr = address.lower().strip()
        
        addr = re.sub(r'\s+', ' ', addr)
        
        addr = re.sub(r'\bвулиця\b', 'вул.', addr)
        addr = re.sub(r'\bпровулок\b', 'пров.', addr)
        addr = re.sub(r'\bпроспект\b', 'просп.', addr)
        addr = re.sub(r'\bплоща\b', 'пл.', addr)
        
        addr = addr.replace('.', '')
        
        return addr

    def _normalize_for_tokens(self, value: str) -> str:
        text = value.lower()
        text = text.replace("'", "").replace("’", "")
        text = re.sub(r"[^0-9a-zа-яіїєґ\s]", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def _tokenize_words(self, value: str) -> List[str]:
        return [token for token in self._normalize_for_tokens(value).split() if token]

    def _filter_trigger_tokens(self, tokens: List[str]) -> List[str]:
        stop = {
            "вул", "вулиця", "пров", "провулок", "просп", "проспект", "пл", "площа",
            "м", "с", "смт", "х", "буд", "будинок",
        }
        filtered = []
        for token in tokens:
            if token in stop:
                continue
            if token.isdigit():
                continue
            if len(token) < 2:
                continue
            filtered.append(token)
        return filtered

    def _max_token_edits(self, token: str) -> int:
        if len(token) <= 4:
            return 1
        return 2

    def _token_distance(self, a: str, b: str, max_edits: int) -> int:
        if abs(len(a) - len(b)) > max_edits:
            return max_edits + 1

        previous = list(range(len(b) + 1))
        for i, ca in enumerate(a, 1):
            current = [i]
            min_row = current[0]
            for j, cb in enumerate(b, 1):
                cost = 0 if ca == cb else 1
                current.append(
                    min(
                        previous[j] + 1,
                        current[j - 1] + 1,
                        previous[j - 1] + cost,
                    )
                )
                if current[j] < min_row:
                    min_row = current[j]
            if min_row > max_edits:
                return max_edits + 1
            previous = current
        return previous[-1]

    def _token_is_match(self, token: str, candidate: str) -> bool:
        if token == candidate:
            return True
        max_edits = self._max_token_edits(token)
        return self._token_distance(token, candidate, max_edits) <= max_edits

    def _tokens_match_sequence(self, query_tokens: List[str], line_tokens: List[str]) -> bool:
        if not query_tokens or not line_tokens:
            return False
        idx = 0
        for token in query_tokens:
            matched = False
            while idx < len(line_tokens):
                if self._token_is_match(token, line_tokens[idx]):
                    matched = True
                    idx += 1
                    break
                idx += 1
            if not matched:
                return False
        return True

    def _fuzzy_token_match(self, token: str, candidates: List[str], threshold: float = 0.72) -> bool:
        for candidate in candidates:
            if SequenceMatcher(None, token, candidate).ratio() >= threshold:
                return True
        return False

    def _line_has_number(self, line: str, number: str) -> bool:
        if not number:
            return False
        normalized_line = self._normalize_for_tokens(line)
        if re.search(rf"\b{re.escape(number.lower())}[а-яa-z]?\b", normalized_line, re.IGNORECASE):
            return True

        normalized_number = re.sub(r"[^0-9a-zа-яіїєґ]", " ", number.lower())
        number_tokens = [token for token in normalized_number.split() if token]
        if not number_tokens:
            return False

        line_tokens = normalized_line.split()
        for idx in range(0, len(line_tokens) - len(number_tokens) + 1):
            if line_tokens[idx: idx + len(number_tokens)] == number_tokens:
                return True
        return False

    def _extract_candidate_address_from_line(
        self,
        line: str,
        number_hint: Optional[str] = None,
    ) -> Optional[str]:
        settlement_match = re.search(
            r"\b(м\.|с\.|смт\.|х\.)\s*([A-Za-zА-ЯІЇЄҐа-яіїєґ'’\- ]+)",
            line,
        )
        street_match = re.search(
            r"\b(вул\.?|вулиця|пров\.?|провулок|пр\.?|просп\.?|проспект|пл\.?|площа)\s*([A-Za-zА-ЯІЇЄҐа-яіїєґ'’\- ]+)",
            line,
            re.IGNORECASE,
        )
        if not street_match:
            return None

        settlement = None
        if settlement_match:
            settlement_prefix = settlement_match.group(1).lower().rstrip('.')
            settlement_name = settlement_match.group(2).strip()
            settlement_name = re.split(r"\b(вул|вулиця|пров|просп|пл)\b", settlement_name, 1)[0]
            settlement_name = settlement_name.strip().rstrip(".,;")
            if settlement_name:
                settlement = f"{settlement_prefix}." + settlement_name

        street_prefix = street_match.group(1).lower().rstrip('.')
        street_name_raw = street_match.group(2).strip()
        street_name = re.split(r"\d", street_name_raw, 1)[0].strip().rstrip(".,;")
        street_prefix_map = {
            "вул": "вул.",
            "вулиця": "вул.",
            "пров": "пров.",
            "провулок": "пров.",
            "пр": "просп.",
            "просп": "просп.",
            "проспект": "просп.",
            "пл": "пл.",
            "площа": "пл.",
        }
        street_prefix_out = street_prefix_map.get(street_prefix, "вул.")
        street = f"{street_prefix_out}{street_name}".strip()
        if number_hint and self._line_has_number(line, number_hint):
            street = f"{street} {number_hint}".strip()

        if settlement:
            return f"{settlement} {street}".strip()
        return street   
    
    def _similarity(self, str1: str, str2: str) -> float:
        return SequenceMatcher(None, str1, str2).ratio()
    
    def _extract_street_and_number(self, address: str) -> tuple[str, str]:
        match = re.match(
            r'(?:вул\.?|вулиця|пров\.?|провулок|просп\.?|проспект|пл\.?|площа|м\.?|с\.?|смт\.?)?\s*([А-ЯІЇЄҐа-яіїєґ\s\'\-]+?)\s+(\d+(?:[а-яА-Я/\-\d]*)?)\s*$',
            address.strip(),
            re.IGNORECASE
        )
        
        if match:
            street = match.group(1).strip()
            number = match.group(2).strip()
            return street, number
        
        return address.strip(), ""
    
    def search(self, query_address: str, threshold: float = 0.6) -> List[Dict]:
        results = []
        
        normalized_query = self._normalize_address(query_address)
        street_query, number_query = self._extract_street_and_number(query_address)
        trigger_tokens = self._filter_trigger_tokens(self._tokenize_words(query_address))
        if not trigger_tokens:
            return []
        
        print(f"\nПошук: '{query_address}'")
        print(f"  Нормалізовано: '{normalized_query}'")
        if number_query:
            print(f"  Вулиця: '{street_query}', Номер: '{number_query}'")
        
        for filename, data in self.cache.items():
            queue = data['queue']
            text = data['text']
            lines = data.get('lines', [])
            
            normalized_text = self._normalize_address(text)
            
            if normalized_query in normalized_text:
                suggested = None
                if data.get("lines"):
                    suggested = self._extract_candidate_address_from_line(
                        data["lines"][0],
                        number_query,
                    )
                results.append({
                    "address": query_address,
                    "suggested_address": suggested,
                    "queue": queue,
                    "queue_label": data['queue_label'],
                    "source_file": filename,
                    "match_type": "exact",
                    "confidence": 1.0,
                })
                continue
            
            if number_query:
                normalized_street = self._normalize_address(street_query)
                
                if normalized_street in normalized_text:
                    pattern = re.escape(normalized_street) + r'\s+' + re.escape(number_query)
                    if re.search(pattern, normalized_text, re.IGNORECASE):
                        suggested = None
                        if data.get("lines"):
                            suggested = self._extract_candidate_address_from_line(
                                data["lines"][0],
                                number_query,
                            )
                        results.append({
                            "address": query_address,
                            "suggested_address": suggested,
                            "queue": queue,
                            "queue_label": data['queue_label'],
                            "source_file": filename,
                            "match_type": "street_and_number",
                            "confidence": 0.95,
                        })
                        continue

            if trigger_tokens:
                for line in lines:
                    line_tokens = self._tokenize_words(line)
                    if not line_tokens:
                        continue
                    if not self._tokens_match_sequence(trigger_tokens, line_tokens):
                        continue
                    if number_query and not self._line_has_number(line, number_query):
                        continue
                    suggested = self._extract_candidate_address_from_line(line, number_query)
                    results.append({
                        "address": query_address,
                        "matched_line": line.strip(),
                        "suggested_address": suggested,
                        "queue": queue,
                        "queue_label": data['queue_label'],
                        "source_file": filename,
                        "match_type": "trigger_tokens_number" if number_query else "trigger_tokens",
                        "confidence": 0.9 if number_query else 0.85,
                    })
                    break
            
            for line in lines:
                normalized_line = self._normalize_address(line)
                similarity = self._similarity(normalized_query, normalized_line)
                
                if similarity >= threshold:
                    suggested = self._extract_candidate_address_from_line(line, number_query)
                    results.append({
                        "address": query_address,
                        "matched_line": line.strip(),
                        "suggested_address": suggested,
                        "queue": queue,
                        "queue_label": data['queue_label'],
                        "source_file": filename,
                        "match_type": "fuzzy",
                        "confidence": round(similarity, 2),
                    })
                    break
        
        results.sort(key=lambda x: x['confidence'], reverse=True)
        
        return results
    
    def search_simple(self, query_address: str) -> Optional[Dict]:
        results = self.search(query_address)
        
        if results:
            best = results[0]
            return {
                "found": True,
                "address": query_address,
                "suggested_address": best.get("suggested_address"),
                "queue": best['queue'],
                "queue_label": best['queue_label'],
                "confidence": best['confidence'],
                "match_type": best['match_type'],
            }
        
        return {
            "found": False,
            "address": query_address,
            "message": "Адресу не знайдено в жодній черзі",
        }


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Пошук адрес у PDF файлах черг")
    parser.add_argument(
        "--pdf-dir",
        default=str(Path(__file__).resolve().parent.parent / "chergu"),
        help="Папка з PDF файлами",
    )
    parser.add_argument(
        "address",
        nargs="?",
        default="вул.Героїв Дніпра 31",
        help="Адреса для пошуку",
    )
    
    args = parser.parse_args()
    
    engine = AddressSearchEngine(args.pdf_dir)
    
    print("\n" + "=" * 80)
    result = engine.search_simple(args.address)
    print("=" * 80)
    
    if result['found']:
        print(f"\n✓ ЗНАЙДЕНО!")
        print(f"  Адреса: {result['address']}")
        print(f"  Черга: {result['queue']} ({result['queue_label']})")
        print(f"  Впевненість: {result['confidence'] * 100:.0f}%")
        print(f"  Тип збігу: {result['match_type']}")
    else:
        print(f"\n✗ НЕ ЗНАЙДЕНО")
        print(f"  Адреса: {result['address']}")
        print(f"  {result['message']}")
    
    print("\n" + "=" * 80)
    print("ДЕТАЛЬНИЙ ПОШУК:")
    print("=" * 80)
    
    all_results = engine.search(args.address)
    if all_results:
        for i, res in enumerate(all_results[:5], 1):
            print(f"\n{i}. Файл: {res['source_file']}")
            print(f"   Черга: {res['queue']}")
            print(f"   Впевненість: {res['confidence'] * 100:.0f}%")
            if 'matched_line' in res:
                print(f"   Знайдено: {res['matched_line'][:100]}")
    else:
        print("Нічого не знайдено")


if __name__ == "__main__":
    main()
