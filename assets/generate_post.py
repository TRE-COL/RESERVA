import os
import urllib.request
import ssl
from PIL import Image, ImageDraw, ImageFont

# Ignorar verificación SSL para descarga de fuentes en macOS
ssl._create_default_https_context = ssl._create_unverified_context

def download_file(url, filename):
    print(f"Descargando {filename}...")
    urllib.request.urlretrieve(url, filename)

def main():
    # 1. Rutas de archivos
    base_dir = "/Users/ds/Proyectos/the-real-escape/tools-nextjs"
    assets_dir = os.path.join(base_dir, "assets")
    bg_path = os.path.join(assets_dir, "punta_cana_resort.png")
    output_path = os.path.join(assets_dir, "TRE_Punta_Cana_Post.png")

    font_reg_url = "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf"
    font_bold_url = "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf"
    font_black_url = "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Black.ttf"

    font_reg_path = os.path.join(assets_dir, "Montserrat-Regular.ttf")
    font_bold_path = os.path.join(assets_dir, "Montserrat-Bold.ttf")
    font_black_path = os.path.join(assets_dir, "Montserrat-Black.ttf")

    # Descargar fuentes si no existen
    if not os.path.exists(font_reg_path):
        download_file(font_reg_url, font_reg_path)
    if not os.path.exists(font_bold_path):
        download_file(font_bold_url, font_bold_path)
    if not os.path.exists(font_black_path):
        download_file(font_black_url, font_black_path)

    # 2. Cargar y recortar imagen de fondo a 1080x1080 (cuadrado)
    print("Cargando imagen de fondo...")
    im = Image.open(bg_path)
    # Recortar a cuadrado centrado
    w, h = im.size
    min_dim = min(w, h)
    left = (w - min_dim) / 2
    top = (h - min_dim) / 2
    right = (w + min_dim) / 2
    bottom = (h + min_dim) / 2
    im_cropped = im.crop((left, top, right, bottom))
    im_final = im_cropped.resize((1080, 1080), Image.Resampling.LANCZOS)

    # Crear capa de dibujo
    overlay = Image.new("RGBA", (1080, 1080), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Cargar Fuentes
    f_reg_10 = ImageFont.truetype(font_reg_path, 10)
    f_reg_12 = ImageFont.truetype(font_reg_path, 12)
    f_bold_12 = ImageFont.truetype(font_bold_path, 12)
    f_bold_14 = ImageFont.truetype(font_bold_path, 14)
    f_bold_22 = ImageFont.truetype(font_bold_path, 22)
    f_black_42 = ImageFont.truetype(font_black_path, 42)
    f_black_32 = ImageFont.truetype(font_black_path, 32)

    # 3. Dibujar tarjeta de overlay (esmerilado crema traslúcido)
    # Dimensiones: ancho 480, alto 980, centrado
    card_w = 480
    card_h = 980
    card_x = (1080 - card_w) // 2
    card_y = (1080 - card_h) // 2

    # Dibujar fondo de tarjeta con opacidad del 88% (#f9f3e1 es 249, 243, 225)
    card_color = (249, 243, 225, 225) # 225 de 255 es aprox 88%
    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=24,
        fill=card_color,
        outline=(255, 255, 255, 120),
        width=2
    )

    # 4. Dibujar el Logotipo Corporativo de "The Real Escape"
    # Coordenadas SVG en caja de 100x100:
    # Ala Izquierda: 80,20 11,50 33,55 -> #204628
    # Centro Izquierdo: 80,20 33,55 45,78 -> #849d71
    # Centro Derecho: 80,20 45,58 45,78 -> #4f6e44
    # Ala Derecha: 80,20 45,58 79,63 -> #204628
    
    logo_size = 72
    logo_left = card_x + (card_w - logo_size) // 2
    logo_top = card_y + 40

    def transform_pt(x, y):
        # Escalar de 100x100 a logo_size x logo_size y desplazar a logo_left/top
        return (logo_left + (x * logo_size / 100), logo_top + (y * logo_size / 100))

    # Ala Izquierda
    p1 = [transform_pt(80, 20), transform_pt(11, 50), transform_pt(33, 55)]
    draw.polygon(p1, fill=(32, 70, 40, 255))
    # Centro Izquierdo
    p2 = [transform_pt(80, 20), transform_pt(33, 55), transform_pt(45, 78)]
    draw.polygon(p2, fill=(132, 157, 113, 255))
    # Centro Derecho
    p3 = [transform_pt(80, 20), transform_pt(45, 58), transform_pt(45, 78)]
    draw.polygon(p3, fill=(79, 110, 68, 255))
    # Ala Derecha
    p4 = [transform_pt(80, 20), transform_pt(45, 58), transform_pt(79, 63)]
    draw.polygon(p4, fill=(32, 70, 40, 255))

    # 5. Dibujar Textos de Branding
    green_dark = (32, 70, 40, 255)
    green_medium = (79, 110, 68, 255)
    accent_brown = (166, 103, 65, 255)

    # THE REAL ESCAPE
    text_brand = "THE REAL ESCAPE"
    # Centrar texto
    box = draw.textbbox((0, 0), text_brand, font=f_bold_22)
    tx = card_x + (card_w - (box[2] - box[0])) // 2
    draw.text((tx, logo_top + logo_size + 15), text_brand, fill=green_dark, font=f_bold_22)

    # Luxury Travel Redefined
    text_tagline = "LUXURY TRAVEL REDEFINED"
    box = draw.textbbox((0, 0), text_tagline, font=f_reg_10)
    tx = card_x + (card_w - (box[2] - box[0])) // 2
    draw.text((tx, logo_top + logo_size + 42), text_tagline, fill=green_medium, font=f_reg_10)

    # Línea divisoria elegante
    sep_w = 40
    sep_x = card_x + (card_w - sep_w) // 2
    sep_y = logo_top + logo_size + 62
    draw.line([sep_x, sep_y, sep_x + sep_w, sep_y], fill=(233, 179, 136, 255), width=2)

    # 6. Contenido Central (Destino y Promoción)
    dest_y = sep_y + 35
    text_dest = "PUNTA CANA"
    box = draw.textbbox((0, 0), text_dest, font=f_black_42)
    tx = card_x + (card_w - (box[2] - box[0])) // 2
    draw.text((tx, dest_y), text_dest, fill=green_dark, font=f_black_42)

    sub_y = dest_y + 55
    text_sub = "5 DÍAS / 4 NOCHES · HOTEL DE LUJO"
    box = draw.textbbox((0, 0), text_sub, font=f_bold_12)
    tx = card_x + (card_w - (box[2] - box[0])) // 2
    draw.text((tx, sub_y), text_sub, fill=accent_brown, font=f_bold_12)

    # Caja de Precio
    price_box_y = sub_y + 25
    price_box_w = 380
    price_box_h = 95
    price_box_x = card_x + (card_w - price_box_w) // 2
    
    # Fondo caja de precio
    draw.rounded_rectangle(
        [price_box_x, price_box_y, price_box_x + price_box_w, price_box_y + price_box_h],
        radius=10,
        fill=(255, 255, 255, 150),
        outline=(32, 70, 40, 30),
        width=1
    )

    # Textos de precio
    p_label = "PLANES DESDE"
    box = draw.textbbox((0, 0), p_label, font=f_bold_12)
    tx = price_box_x + (price_box_w - (box[2] - box[0])) // 2
    draw.text((tx, price_box_y + 12), p_label, fill=(120, 110, 100, 255), font=f_bold_12)

    p_amount = "$2.650.000"
    box = draw.textbbox((0, 0), p_amount, font=f_black_32)
    tx = price_box_x + (price_box_w - (box[2] - box[0])) // 2
    draw.text((tx, price_box_y + 28), p_amount, fill=green_dark, font=f_black_32)

    p_suffix = "COP / POR PERSONA"
    box = draw.textbbox((0, 0), p_suffix, font=f_bold_12)
    tx = price_box_x + (price_box_w - (box[2] - box[0])) // 2
    draw.text((tx, price_box_y + 68), p_suffix, fill=green_medium, font=f_bold_12)

    # 7. Dibujar Lista de Inclusiones
    inc_y_start = price_box_y + price_box_h + 30
    inclusions = [
        "✈️  Vuelos incluidos ida y vuelta",
        "🏨  Hotel con playa privada premium",
        "🍽️  Alimentación completa y snacks",
        "🍹  Bebidas y licores ilimitados",
        "🚌  Traslados hotel - aeropuerto",
        "🛡️  Seguro médico internacional"
    ]

    for idx, inc in enumerate(inclusions):
        curr_y = inc_y_start + (idx * 38)
        # Dibujar texto
        draw.text((card_x + 50, curr_y), inc, fill=(40, 34, 13, 255), font=f_bold_14)

    # 8. Pie / CTA
    cta_y = inc_y_start + (len(inclusions) * 38) + 20
    cta_text_1 = "Escríbenos para agendar una videollamada"
    cta_text_2 = "y diseñar tu escape a medida."
    
    box = draw.textbbox((0, 0), cta_text_1, font=f_reg_12)
    tx = card_x + (card_w - (box[2] - box[0])) // 2
    draw.text((tx, cta_y), cta_text_1, fill=green_medium, font=f_reg_12)
    
    box = draw.textbbox((0, 0), cta_text_2, font=f_reg_12)
    tx = card_x + (card_w - (box[2] - box[0])) // 2
    draw.text((tx, cta_y + 18), cta_text_2, fill=green_medium, font=f_reg_12)

    # Botón CTA simulado
    btn_w = 280
    btn_h = 42
    btn_x = card_x + (card_w - btn_w) // 2
    btn_y = cta_y + 45
    draw.rounded_rectangle(
        [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
        radius=21,
        fill=green_dark
    )

    btn_text = "AGENDAR VIDEOLLAMADA"
    box = draw.textbbox((0, 0), btn_text, font=f_bold_12)
    tx = btn_x + (btn_w - (box[2] - box[0])) // 2
    ty = btn_y + (btn_h - (box[3] - box[1])) // 2 - 2
    draw.text((tx, ty), btn_text, fill=(255, 255, 255, 255), font=f_bold_12)

    # Fusionar imagen y guardar
    im_final = Image.alpha_composite(im_final.convert("RGBA"), overlay)
    im_final.convert("RGB").save(output_path, "PNG")
    print(f"¡Éxito! Post guardado en {output_path}")

if __name__ == "__main__":
    main()
