const axios = require('axios');
const fs = require('fs');


class Busquedas {

    historial = []
    dbPath= './db/database.json'

    constructor() {
        this.leerDB();
    }

    get paramsMapbox() {
        return {
            'access_token': process.env.MAPBOX_KEY,
            'limit': 5,
            'language': 'es'
        }
    }

    get paramsWeather() {
        return {
            'appid': process.env.OPENWEATHER_KEY,
            'units': 'metric',
            'lang': 'es'
        }
    }

    get historialCapitalizado() {
        return this.historial.map(lugar => {
            let palabras = lugar.split(' ');
            palabras = palabras.map( palabra => palabra[0].toUpperCase() + palabra.substring(1));

            return palabras.join(' ')
        })
    }

    //https://api.openweathermap.org/data/2.5/weather?lat=37.222696&lon=-3.686566&appid=c0641e8cce44216a3b9aab97b094f0f7&units=metric&lang=es

    async ciudad( lugar = '' ) {

        try {

            const instance = axios.create({
                baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${lugar}.json`,
                params: this.paramsMapbox
            })

            const resp = await instance.get();
            return resp.data.features.map( lugar => ({
                id: lugar.id,
                nombre: lugar.place_name,
                lng: lugar.center[0],
                lat: lugar.center[1],
            }));

        } catch (error) {
            return [];
        }

    } 
    
    async climaLugar( lat, lon) {
        
        try {

            const instance = axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather`,
                params: { ... this.paramsWeather, lat, lon }
            })

            const resp = await instance.get();
            const {weather, main} = resp.data;

            return {
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp
            }

        } catch (error) {
            return [];
        }
    }

    agregarHistorial( lugar = '' ) {
        // Prevenir duplicados
        if ( this.historial.includes( lugar.toLocaleLowerCase() )) {
            return;
        }

        this.historial = this.historial.splice(0,4)

        this.historial.unshift(lugar.toLocaleLowerCase() );
        // Grabar en JSON
        this.guardarDB();
    }

    guardarDB() {
        const payload = {
            historial: this.historial
        };

        fs.writeFileSync( this.dbPath, JSON.stringify( payload ));
    }

    leerDB() {
        if ( !fs.existsSync( this.dbPath ) ) return;

        const info = fs.readFileSync( this.dbPath, {encoding: 'utf-8'});
        const data = JSON.parse(info);

        this.historial = data.historial;
    }

}

module.exports = Busquedas;