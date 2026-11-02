from PIL import Image

orig = Image.open(r"C:\Users\adars\.gemini\antigravity-ide\brain\d09a80e1-7799-4ec7-b521-b4a31e01abae\bhature_offer_plate_3d_1793178600192.jpg")
print("Original format:", orig.format, orig.size, orig.mode)
# It's an RGB JPEG image! It has NO alpha channel!
# It's a completely intact photograph/render!
