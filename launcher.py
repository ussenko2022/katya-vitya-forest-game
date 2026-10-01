"""Windows friendly launcher: opens the game and manages local AI narration."""

from __future__ import annotations

import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import queue
import sys
import threading
import tkinter as tk
from tkinter import messagebox, ttk
from urllib.parse import unquote, urlsplit
import webbrowser


def find_project_root() -> Path:
    start = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
    for candidate in (start, start.parent):
        if (candidate / "dist" / "index.html").is_file() and (candidate / "locales" / "ru.json").is_file():
            return candidate
    raise RuntimeError("Не найдены файлы игры. Поместите запускатор рядом с папками dist и locales.")


ROOT = find_project_root()
os.environ["FOREST_GAME_ROOT"] = str(ROOT)
from tools.generate_audio import generate, read_env, settings  # noqa: E402


class LocalOnlyHandler(SimpleHTTPRequestHandler):
    def _allowed(self) -> bool:
        path = unquote(urlsplit(self.path).path)
        return not any(part.startswith(".") for part in Path(path).parts if part not in ("/", "\\"))

    def do_GET(self) -> None:
        if not self._allowed():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        if not self._allowed():
            self.send_error(404)
            return
        super().do_HEAD()

    def log_message(self, *_args) -> None:
        pass


class Launcher(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Катя и Витя в лесу — запускатор")
        self.geometry("620x420")
        self.minsize(550, 390)
        self.configure(bg="#eaf5df")
        self.server: ThreadingHTTPServer | None = None
        self.events: queue.Queue[tuple[str, object]] = queue.Queue()
        self.busy = False
        self._build_ui()
        self.after(120, self._poll_events)
        self.protocol("WM_DELETE_WINDOW", self._close)

    def _build_ui(self) -> None:
        env = read_env()
        _, current_model, current_voices = settings()
        frame = ttk.Frame(self, padding=22)
        frame.pack(fill="both", expand=True, padx=14, pady=14)
        ttk.Label(frame, text="🌲 Катя и Витя в лесу", font=("Segoe UI", 19, "bold")).pack(anchor="w")
        ttk.Label(frame, text="Локальная игра и управление озвучкой", font=("Segoe UI", 10)).pack(anchor="w", pady=(0, 16))

        ttk.Button(frame, text="▶ Открыть игру в браузере", command=self._open_game).pack(fill="x", ipady=8)
        settings_frame = ttk.LabelFrame(frame, text="Настройки OpenAI", padding=12)
        settings_frame.pack(fill="x", pady=16)
        settings_frame.columnconfigure(1, weight=1)

        self.key_var = tk.StringVar(value=os.environ.get("OPENAI_API_KEY") or env.get("OPENAI_API_KEY") or env.get("openai_token") or "")
        self.model_var = tk.StringVar(value=current_model)
        self.female_var = tk.StringVar(value=current_voices["female"])
        self.male_var = tk.StringVar(value=current_voices["male"])
        rows = [
            ("API-ключ", self.key_var, True),
            ("Модель", self.model_var, False),
            ("Женский голос", self.female_var, False),
            ("Мужской голос", self.male_var, False),
        ]
        for row, (label, variable, secret) in enumerate(rows):
            ttk.Label(settings_frame, text=label).grid(row=row, column=0, sticky="w", padx=(0, 12), pady=4)
            ttk.Entry(settings_frame, textvariable=variable, show="●" if secret else "").grid(row=row, column=1, sticky="ew", pady=4)

        buttons = ttk.Frame(frame)
        buttons.pack(fill="x")
        ttk.Button(buttons, text="Сохранить настройки", command=self._save_settings).pack(side="left", expand=True, fill="x", padx=(0, 7))
        ttk.Button(buttons, text="Проверить аудио", command=self._check_audio).pack(side="left", expand=True, fill="x", padx=7)
        self.generate_button = ttk.Button(buttons, text="Создать / обновить аудио", command=self._generate_audio)
        self.generate_button.pack(side="left", expand=True, fill="x", padx=(7, 0))

        self.status = tk.StringVar(value="Игра готова к запуску.")
        ttk.Label(frame, textvariable=self.status, wraplength=550, font=("Segoe UI", 10)).pack(anchor="w", pady=(18, 0))
        ttk.Label(frame, text="Ключ хранится только в локальном .env и не передаётся в браузер.", font=("Segoe UI", 9)).pack(anchor="w", pady=(9, 0))

    def _save_settings(self) -> bool:
        key = self.key_var.get().strip()
        if not key:
            messagebox.showerror("Нужен ключ", "Укажите OpenAI API-ключ перед сохранением.")
            return False
        values = {
            "OPENAI_API_KEY": key,
            "OPENAI_TTS_MODEL": self.model_var.get().strip() or "gpt-4o-mini-tts",
            "OPENAI_TTS_FEMALE_VOICE": self.female_var.get().strip() or "marin",
            "OPENAI_TTS_MALE_VOICE": self.male_var.get().strip() or "cedar",
        }
        target = ROOT / ".env"
        temporary = ROOT / ".env.tmp"
        temporary.write_text("\n".join(f"{name}={value}" for name, value in values.items()) + "\n", encoding="utf-8")
        temporary.replace(target)
        self.status.set("Настройки сохранены в локальный .env.")
        return True

    def _open_game(self) -> None:
        if self.server is None:
            handler = functools.partial(LocalOnlyHandler, directory=str(ROOT / "dist"))
            self.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
            self.server.daemon_threads = True
            threading.Thread(target=self.server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{self.server.server_port}/"
        webbrowser.open(url)
        self.status.set("Игра открыта. После генерации аудио обновите страницу в браузере.")

    def _check_audio(self) -> None:
        try:
            result = generate(check_only=True)
            self.status.set(f"Готово: {result['cached']} из {result['total']} фраз. Нужно создать: {result['missing']}.")
        except Exception as error:
            messagebox.showerror("Ошибка проверки", str(error))

    def _generate_audio(self) -> None:
        if self.busy or not self._save_settings():
            return
        self.busy = True
        self.generate_button.configure(state="disabled")
        self.status.set("Создаю недостающие фразы через OpenAI…")

        def work() -> None:
            try:
                result = generate(progress=lambda done,total:self.events.put(("progress",(done,total))))
                self.events.put(("done",result))
            except Exception as error:
                self.events.put(("error",str(error)))

        threading.Thread(target=work, daemon=True).start()

    def _poll_events(self) -> None:
        try:
            while True:
                kind, payload = self.events.get_nowait()
                if kind == "progress":
                    done,total = payload
                    self.status.set(f"Создано {done} из {total} недостающих фраз…")
                elif kind == "done":
                    self.busy = False
                    self.generate_button.configure(state="normal")
                    self.status.set(f"Готово: {payload['generated']} новых фраз. Обновите игру в браузере.")
                elif kind == "error":
                    self.busy = False
                    self.generate_button.configure(state="normal")
                    self.status.set("Генерация остановлена. Уже созданные файлы сохранены.")
                    messagebox.showerror("Ошибка озвучки", str(payload))
        except queue.Empty:
            pass
        self.after(120, self._poll_events)

    def _close(self) -> None:
        if self.server:
            self.server.shutdown()
            self.server.server_close()
        self.destroy()


if __name__ == "__main__":
    Launcher().mainloop()
