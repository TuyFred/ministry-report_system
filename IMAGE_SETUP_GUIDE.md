# Image Setup Guide for Ministry Report System

## Where to Place Your Images

Save your images in this folder:
```
client/public/images/
```

## Required Images

You need to save 4 images with these exact names:

### 1. slide1.jpg
- **Source**: The group photo (people standing on rooftop)
- **Recommended Size**: 1920x1080px or higher
- **Format**: JPG or PNG

### 2. slide2.jpg
- **Source**: "Ministry Formation" with fish logo (blue background)
- **Recommended Size**: 1920x1080px or higher
- **Format**: JPG or PNG

### 3. slide3.jpg
- **Source**: Globe image (world map on globe)
- **Recommended Size**: 1920x1080px or higher
- **Format**: JPG or PNG

### 4. slide4.jpg
- **Source**: Children reading Bible image
- **Recommended Size**: 1920x1080px or higher
- **Format**: JPG or PNG

## How to Add Images

1. Open File Explorer
2. Navigate to: `C:\Users\user\ministry-report-system\client\public\images\`
3. Copy your 4 images into this folder
4. Rename them exactly as: `slide1.jpg`, `slide2.jpg`, `slide3.jpg`, `slide4.jpg`
5. Refresh your browser to see the slideshow

## Image Optimization Tips

For best performance:
- **Resolution**: 1920x1080px (Full HD)
- **File Size**: Keep each image under 500KB
- **Format**: JPG for photos (smaller file size)
- **Quality**: 80-85% compression is ideal

## What's Been Implemented

✅ **Professional Welcome Page with:**
- Automatic slideshow (changes every 5 seconds)
- Manual navigation arrows (left/right)
- Slide indicators (dots at bottom)
- Smooth fade transitions
- Beautiful overlay with gradient
- Non-clickable background (slideshow only)
- Responsive design

✅ **Edit Report Feature:**
- Edit button on each report (visible only to report owner)
- Click "Edit" to update any field
- Form pre-fills with existing data
- Save updates back to database

## Troubleshooting

**If images don't show:**
1. Check image names are exactly: slide1.jpg, slide2.jpg, etc.
2. Check images are in: `client/public/images/` folder
3. Hard refresh browser: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
4. Clear browser cache

**If slideshow doesn't work:**
- The slideshow will use gradient backgrounds if images are missing
- Check browser console (F12) for any errors

## Features Added

### 1. Professional Welcome Page
- Full-screen background slideshow
- Automatic transitions every 5 seconds
- Manual navigation with arrow buttons
- Slide indicators for current position
- Overlay text changes with each slide
- Responsive and mobile-friendly

### 2. Edit Report Button
- Appears on each report card
- Only visible to the report's owner (member who created it)
- Click to edit and update report
- All fields are editable
- Preserves all existing data

### 3. Non-Clickable Background
- Background images cannot be clicked
- Only navigation buttons work
- Prevents accidental interactions
- Professional user experience

## Testing

1. **Test Slideshow:**
   - Visit homepage (http://localhost:3000)
   - Wait 5 seconds to see automatic transition
   - Click left/right arrows
   - Click slide indicators

2. **Test Edit Feature:**
   - Login as a member
   - Go to "View Reports"
   - Find your own report
   - Click "Edit" button
   - Update fields and save
   - Verify changes appear

Enjoy your professional Ministry Report System! 🎉
