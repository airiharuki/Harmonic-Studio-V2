# Project TODOs

## 🎵 YouTube Download Fix (Cookies)
To ensure `yt-dlp` works reliably with YouTube (especially for age-restricted or region-locked content), you need to provide a `cookies.txt` file.

### Steps to complete:
1. **Install a Cookie Export Extension**:
   - Install "Get cookies.txt LOCALLY" (Chrome/Edge/Firefox).
2. **Export YouTube Cookies**:
   - Go to [YouTube.com](https://www.youtube.com) and log in.
   - Click the extension and export the cookies in **Netscape format**.
3. **Add to Project**:
   - Save the file as `cookies.txt`.
   - Upload/Move it to the **root directory** of this project (the same folder as `package.json`).
4. **Restart Server**:
   - The app is already configured to detect this file automatically once it exists.

---

## 🚀 Future Improvements
- [ ] Add batch processing for playlists.
- [ ] Implement custom stem naming.
- [ ] Add visual waveform for the scrobbling bar.
