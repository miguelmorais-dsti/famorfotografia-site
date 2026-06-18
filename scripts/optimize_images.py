import os
import subprocess

# Configurações
PHOTOS_DIR = "projetos/famorfotografia-site/assets/photos"
MAX_WIDTH = 2000
QUALITY = 75

def optimize_images():
    if not os.path.exists(PHOTOS_DIR):
        print(f"Erro: Pasta {PHOTOS_DIR} não encontrada.")
        return

    # Listar pastas de álbuns (excluindo pastas ocultas)
    album_folders = sorted([f for f in os.listdir(PHOTOS_DIR) if os.path.isdir(os.path.join(PHOTOS_DIR, f)) and not f.startswith('.')])

    for folder in album_folders:
        folder_path = os.path.join(PHOTOS_DIR, folder)
        print(f"Otimizando álbum: {folder}...")
        
        valid_extensions = ('.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG')
        photos = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(valid_extensions) and not f.startswith('.')])
        
        for p in photos:
            file_path = os.path.join(folder_path, p)
            temp_path = file_path + ".tmp.webp"
            
            # Comando ffmpeg para redimensionar e comprimir
            # -vf scale='min(2000,iw)':-1: redimensiona se a largura for maior que 2000
            # -q:v 75: qualidade da compressão webp
            cmd = [
                "ffmpeg", "-y", "-i", file_path,
                "-vf", f"scale='min({MAX_WIDTH},iw)':-1",
                "-q:v", str(QUALITY),
                temp_path
            ]
            
            try:
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                # Substituir o original pelo otimizado (sempre convertendo para .webp para consistência)
                if file_path.lower().endswith('.webp'):
                    os.replace(temp_path, file_path)
                else:
                    new_path = os.path.splitext(file_path)[0] + ".webp"
                    os.replace(temp_path, new_path)
                    os.remove(file_path) # Remove original se não for webp
            except subprocess.CalledProcessError as e:
                print(f"Erro ao processar {file_path}: {e}")
                if os.path.exists(temp_path):
                    os.remove(temp_path)

    print("Otimização concluída!")

if __name__ == "__main__":
    optimize_images()
