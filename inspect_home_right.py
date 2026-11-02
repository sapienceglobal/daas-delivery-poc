from PIL import Image

im = Image.open(r"E:\Projects\daas-delivery-poc\home_hero_right.png")
w, h = im.size
print("home_hero_right size:", w, h)
# Check top-right, bottom-left, center
print("Top right pixel:", im.getpixel((w - 5, 5)))
print("Top left pixel:", im.getpixel((5, 5)))
print("Bottom right pixel:", im.getpixel((w - 5, h - 5)))
print("Center pixel:", im.getpixel((w // 2, h // 2)))
