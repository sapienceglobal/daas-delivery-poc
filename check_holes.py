from PIL import Image

iso = Image.open(r"E:\Projects\daas-delivery-poc\plate_test_isolated.png")
print("plate_test_isolated size:", iso.size)

# In orig, the left bhatura is at x=200..450, y=250..500
# With bbox (73, 125), that corresponds to x=127..377, y=125..375 in iso
# Let's count how many pixels have alpha == 0 in that region (inside the bhatura!):
transparent_holes = 0
for y in range(125, 375):
    for x in range(127, 377):
        p = iso.getpixel((x, y))
        if p[3] < 50:
            transparent_holes += 1

print("Total transparent hole pixels inside the left bhatura in plate_test_isolated.png:", transparent_holes)
