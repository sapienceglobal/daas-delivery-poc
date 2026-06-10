# Production Deployment

## Backend environment

Set these values in the VPS process environment or `backend/.env`:

```dotenv
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/daas_poc
JWT_SECRET=<long-random-secret-at-least-32-characters>
CORS_ORIGINS=http://195.35.20.207:3001
TRUST_PROXY=1
COOKIE_SECURE=false
SEED_DEMO_DATA=false
```

`COOKIE_SECURE=false` is only for the current plain HTTP deployment. Put the
frontend and backend behind HTTPS, then set it to `true`.

## MongoDB and PM2 checks

```bash
sudo systemctl status mongod
sudo systemctl restart mongod
sudo journalctl -u mongod -n 100 --no-pager
mongosh "$MONGODB_URI" --eval "db.runCommand({ ping: 1 })"
pm2 restart daas-backend --update-env
pm2 logs daas-backend --lines 100
curl -i http://127.0.0.1:5001/api/health
```

The readiness endpoint must return HTTP 200 with `"database":"connected"`.
The process now exits during startup when MongoDB is unavailable instead of
accepting requests that later time out.

## Flutter API target

The default app target is the live API. Override it for local real-device
testing without editing source code:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.15:5000
```

Replace the address with the laptop's current Wi-Fi IPv4 address. For a release:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
```
