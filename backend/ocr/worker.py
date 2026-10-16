"""Private stdin/stdout OCR worker. No HTTP server and no runtime downloads."""
import contextlib
import json
from pathlib import Path
import socket
import sys


def no_network(*args, **kwargs):
    raise RuntimeError("OCR runtime network access is disabled")


socket.socket.connect = no_network
socket.socket.connect_ex = no_network
socket.create_connection = no_network
sys.stdout.reconfigure(encoding="utf-8")
sys.stdin.reconfigure(encoding="utf-8")


def main():
    # Keep library logs out of the JSON protocol.
    with contextlib.redirect_stdout(sys.stderr):
        import rapidocr
        from rapidocr import RapidOCR
        import numpy as np
        models = Path(rapidocr.__file__).resolve().parent / "models"
        paths = {"Det.model_path": models / "PP-OCRv6_det_small.onnx",
                 "Rec.model_path": models / "PP-OCRv6_rec_small.onnx",
                 "Cls.model_path": models / "ch_ppocr_mobile_v2.0_cls_mobile.onnx"}
        if not all(p.is_file() for p in paths.values()):
            raise RuntimeError("Bundled OCR models missing; reinstall requirements.txt")
        params = {k: str(v) for k, v in paths.items()}
        params.update({"Global.log_level": "error",
                       "EngineConfig.onnxruntime.intra_op_num_threads": 2,
                       "EngineConfig.onnxruntime.inter_op_num_threads": 1})
        engine = RapidOCR(params=params)
        if "--check" in sys.argv:
            engine(np.full((64, 256, 3), 255, dtype=np.uint8))
            output = {"ok": True, "engine": "RapidOCR 3.9.2 / ONNX Runtime CPU", "offline": True}
        else:
            request = json.loads(sys.stdin.read(65537))
            files = request["images"]
            if not isinstance(files, list) or not 1 <= len(files) <= 30:
                raise ValueError("Invalid page count")
            texts = []
            for filename in files:
                image = Path(filename)
                if not image.is_absolute() or image.suffix != ".png" or image.stat().st_size > 12 * 1024 * 1024:
                    raise ValueError("Invalid OCR image")
                result = engine(str(image))
                text = "\n".join(result.txts or [])
                if len(text) > 30000:
                    raise ValueError("OCR page text exceeds limit")
                texts.append(text)
            output = {"ok": True, "texts": texts}
    print(json.dumps(output, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(type(exc).__name__ + ": " + str(exc), file=sys.stderr)
        print(json.dumps({"ok": False, "message": "本地OCR运行失败，请执行安装/检查脚本"}, ensure_ascii=False))
        sys.exit(1)
