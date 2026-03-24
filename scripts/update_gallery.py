import os
import json

# Configurações
BASE_DIR = "famorfotografia-site"
PHOTOS_DIR = os.path.join(BASE_DIR, "assets/photos")
DATA_FILE = os.path.join(BASE_DIR, "gallery-data.js")

def update_gallery():
    if not os.path.exists(PHOTOS_DIR):
        print(f"Erro: Pasta {PHOTOS_DIR} não encontrada.")
        return

    albums = []
    
    # Listar pastas de álbuns (excluindo pastas ocultas)
    album_folders = sorted([f for f in os.listdir(PHOTOS_DIR) if os.path.isdir(os.path.join(PHOTOS_DIR, f)) and not f.startswith('.')])

    for folder in album_folders:
        folder_path = os.path.join(PHOTOS_DIR, folder)
        # Listar todas as imagens na pasta
        valid_extensions = ('.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG')
        photos = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(valid_extensions) and not f.startswith('.')])
        
        if not photos:
            continue

        # Tentar encontrar a capa
        cover = ""
        for p in photos:
            if "capa" in p.lower():
                cover = f"assets/photos/{folder}/{p}"
                break
        
        if not cover:
            cover = f"assets/photos/{folder}/{photos[0]}"

        # Formatar lista de fotos para o JS
        photo_paths = [f"assets/photos/{folder}/{p}" for p in photos]

        # Criar objeto do álbum
        # O título será o nome da pasta com a primeira letra maiúscula e hífens trocados por espaços
        title = folder.replace('-', ' ').title().replace('And', '&')
        
        albums.append({
            "id": folder,
            "title": title,
            "cover": cover,
            "photos": photo_paths
        })

    # Gerar o conteúdo do ficheiro JS
    js_content = f"window.FAMOR_ALBUMS = {json.dumps(albums, indent=2, ensure_ascii=False)};"
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(js_content)
    
    print(f"Sucesso! Galeria atualizada com {len(albums)} álbuns no ficheiro {DATA_FILE}")

if __name__ == "__main__":
    update_gallery()
