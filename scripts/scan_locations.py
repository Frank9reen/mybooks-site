import json
import re
from pathlib import Path

d = json.loads(Path(r"d:\PYTHON\4-Sites\mybooks-site\data\part1.json").read_text(encoding="utf-8"))
keys = (
    r"Сокол|Аэропорт|Динамо|Мнёвник|Полежаев|Ополчен|Владыкин|Петровско|Тимирязев|"
    r"Дмитров|Савёлов|Менделеев|Тверск|Охотн|Театральн|Спартак|Щукин|Октябрьск|"
    r"Речной|Водн(?:ый|ик)|Войков|Марьин|Достоев|Кузнецк|Синхро|лаборатор|"
    r"поверхност|квартир|коллектор|Цирк|Чертополох|Инженер|Свободн|Печатник|"
    r"Врач|Сон|Левиафан|Покровск|Лиственнич|Москва-река|мост"
)
for i, c in enumerate(d["chapters"]):
    text = " ".join(p.get("text", "") for p in c["paragraphs"] if p.get("type") != "break")
    found = sorted(set(re.findall(keys, text, re.I)))
    print(f"--- {i} {c['title']} ---")
    print(", ".join(found)[:220])
    print(text[:320].replace("\n", " "))
    print()
