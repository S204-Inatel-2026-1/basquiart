import uuid
import os
import aiofiles
from fastapi import UploadFile

UPLOAD_DIR = './database/images'
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 50


class ImageHandler:
    def __init__(self, upload_dir: str = UPLOAD_DIR, fs=os, file_opener=aiofiles.open, id_generator=uuid.uuid4):
        self.upload_dir = upload_dir
        self.fs = fs
        self.file_opener = file_opener
        self.id_generator = id_generator

    async def save(self, file: UploadFile) -> str:
        """Validates and saves an image, returns the URL path."""
        self._validate_type(file)
        contents = await self._validate_size(file)

        filename = self._generate_filename(file.filename)
        path = self.fs.path.join(self.upload_dir, filename)

        async with self.file_opener(path, "wb") as f:
            await f.write(contents)

        return f"/images/{filename}"

    def delete(self, image_url: str):
        """Deletes an image file given its URL path."""
        filename = self.fs.path.basename(image_url)
        path = self.fs.path.join(self.upload_dir, filename)

        if not self.fs.path.abspath(path).startswith(self.fs.path.abspath(self.upload_dir)):
            raise ValueError("Invalid image path")

        if not self.fs.path.exists(path):
            raise FileNotFoundError(f"Image not found: {filename}")

        self.fs.remove(path)

    def _validate_type(self, file: UploadFile):
        if file.content_type not in ALLOWED_TYPES:
            raise ValueError(f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}")

    async def _validate_size(self, file: UploadFile) -> bytes:
        contents = await file.read()
        size_mb = len(contents) / (1024 * 1024)
        if size_mb > MAX_SIZE_MB:
            raise ValueError(f"File too large. Max size is {MAX_SIZE_MB}MB")
        return contents

    def _generate_filename(self, original: str) -> str:
        ext = self.fs.path.splitext(original)[-1]
        return f"{self.id_generator()}{ext}"


image_handler = ImageHandler()
