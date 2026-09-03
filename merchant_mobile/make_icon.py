import os
from PIL import Image

def process_icon():
    input_path = "assets/images/branded/lassi-lounge/Lassi-Lounge-icon.png"
    ios_output = "assets/images/branded/lassi-lounge/admin_icon_ios.png"
    android_fg_output = "assets/images/branded/lassi-lounge/admin_icon_fg.png"
    
    img = Image.open(input_path).convert("RGBA")
    
    # The Lassi-Lounge-icon.png is probably already transparent and tightly cropped.
    # We want it to take up about 60% of the icon so it fits nicely inside the adaptive icon mask.
    
    # Create base images (1024x1024 is a good size for icons)
    base_size = 1024
    
    # 1. iOS Icon (needs solid background)
    bg_color = (17, 24, 39, 255) # #111827 Dark Slate
    ios_bg = Image.new("RGBA", (base_size, base_size), bg_color)
    
    # 2. Android Foreground (needs transparent background)
    android_fg = Image.new("RGBA", (base_size, base_size), (0, 0, 0, 0))
    
    # Scale the logo
    # For Android adaptive icons, the safe zone is the inner 66% of the image.
    # So the logo should fit within roughly 60% of the canvas to be safe.
    scale_factor = (base_size * 0.6) / max(img.width, img.height)
    new_w = int(img.width * scale_factor)
    new_h = int(img.height * scale_factor)
    
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Center position
    offset_x = (base_size - new_w) // 2
    offset_y = (base_size - new_h) // 2
    
    # Paste logo onto both
    ios_bg.paste(img_resized, (offset_x, offset_y), img_resized)
    android_fg.paste(img_resized, (offset_x, offset_y), img_resized)
    
    # Save
    ios_bg.save(ios_output)
    android_fg.save(android_fg_output)
    print(f"Saved {ios_output} and {android_fg_output}")

if __name__ == "__main__":
    process_icon()
