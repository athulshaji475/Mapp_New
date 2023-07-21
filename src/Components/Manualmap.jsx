import React, { useRef, useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Timeline, TimelineEvent } from 'react-event-timeline';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
const containerStyle = {
  width: '100%',
  height: '70vh',
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

function Manualmap() {
  const navigator=useNavigate()
  const mapRef = useRef(null);
  const audioRef = useRef(null);

  const [pinnedLocations, setPinnedLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [calcArea, setCalcArea] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [polylinePath, setPolylinePath] = useState([]);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [directions, setDirections] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);


  const handlePinCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.log('Error retrieving location:', error);
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  };

  const handleMapClick = (event) => {
    if (!isCalculating) {
      const clickedLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        time: moment().format('YYYY-MM-DD HH:mm:ss'),
      };

      setLocations((prevLocations) => [...prevLocations, clickedLocation]);
    }
  };

  const calculatePolygonArea = () => {
    if (!apiLoaded) {
      console.log('Google Maps API is still loading. Please wait.');
      return;
    }

    if (locations.length < 3) {
      console.log('At least 3 locations are required to calculate the area.');
      return;
    }

    const googleMaps = window.google.maps;

    const polygonPath = locations.map((location) => new googleMaps.LatLng(location.lat, location.lng));
    const polygon = new googleMaps.Polygon({ paths: polygonPath });

    const area = googleMaps.geometry.spherical.computeArea(polygon.getPath());
    setCalcArea(area);
    setShowArea(true);
    console.log('Polygon area:', area);
  };

  const handleSearch = () => {
    if (!apiLoaded) {
      console.log('Google Maps API is still loading. Please wait.');
      return;
    }

    const googleMaps = window.google.maps;
    const geocoder = new googleMaps.Geocoder();

    geocoder.geocode({ address: fromLocation }, (results, status) => {
      if (status === googleMaps.GeocoderStatus.OK) {
        const { lat, lng } = results[0].geometry.location;
        setCurrentLocation({ lat: lat(), lng: lng() });
      } else {
        console.log('Geocode was not successful for the following reason:', status);
      }
    });

    geocoder.geocode({ address: toLocation }, (results, status) => {
      if (status === googleMaps.GeocoderStatus.OK) {
        const { lat, lng } = results[0].geometry.location;
        setToLocation({ lat: lat(), lng: lng() });
      } else {
        console.log('Geocode was not successful for the following reason:', status);
      }
    });
  };

  const handleStart = () => {
    if (fromLocation && toLocation) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: fromLocation,
          destination: toLocation,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            playVoiceDirections(result);
          } else {
            console.error('Directions request failed:', status);
          }
        }
      );
    }
  };

  const playVoiceDirections = (result) => {
    if (audioRef.current && result && result.routes && result.routes.length > 0) {
      const route = result.routes[0];
      const legs = route.legs;

      let voiceDirections = '';

      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const steps = leg.steps;

        for (let j = 0; j < steps.length; j++) {
          const step = steps[j];
          voiceDirections += step.instructions + '. ';
        }
      }

      audioRef.current.text = voiceDirections;
      audioRef.current.play();
    }
  };

  const handleLoad = () => {
    setApiLoaded(true);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.log('Error retrieving location:', error);
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }, []);

  const HandleManual=()=>{
    try {
      navigator('/Manualmap')
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div style={{ height: '100%' }}>
    
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <input
          type='text'
          className='form-control'
          placeholder='From'
          value={fromLocation}
          onChange={(e) => setFromLocation(e.target.value)}
        />
        <input
          type='text'
          className='form-control'
          placeholder='To'
          value={toLocation}
          onChange={(e) => setToLocation(e.target.value)}
        />
        <button className='btn btn-danger' onClick={handleSearch}>
          Search
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px' }}>
        <LoadScript
          googleMapsApiKey='AIzaSyBEKSlBoYpYsCEf1nOk5GprL87pMz7ZMp8'
          libraries={['places', 'geometry']}
          onLoad={handleLoad}
        >
         <GoogleMap
  ref={mapRef}
  mapContainerStyle={containerStyle}
  center={currentLocation || center}
  zoom={10}
  onClick={handleMapClick}
>
  {currentLocation && <Marker position={currentLocation} />}
  {pinnedLocations.map((location, index) => (
    <Marker key={index} position={location} />
  ))}
  {locations.map((event, index) => (
    <Marker key={index} position={event} />
  ))}
  {polylinePath.length > 0 && <Polyline path={polylinePath} options={{ strokeColor: '#FF0000' }} />}
  {directions && <DirectionsRenderer directions={directions} />}
  {fromLocation && <Marker position={fromLocation} />}
  {toLocation && <Marker position={toLocation} />}
</GoogleMap>
        </LoadScript>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
  <button className='btn btn-primary' onClick={handlePinCurrentLocation}>
    Pin Current Location
  </button>
  <button className='btn btn-success' onClick={calculatePolygonArea}>
    Calculate Area
  </button>
</div>
       
      </div>
      {showArea && (
        <div style={{ backgroundColor: 'lightcyan', marginTop: '10px', padding: '10px' }}>
          <h5>Calculated Area:</h5>
          <div>{calcArea} square meters</div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <Timeline lineStyle={{ background: '#ddd', width: '2px' }}>
          {locations.map((event, index) => (
            <TimelineEvent
              key={index}
              title={moment(event.time).format('YYYY-MM-DD HH:mm:ss')}
              icon={<i className='fa fa-map-marker' />}
              bubbleStyle={{ border: '2px solid #007bff' }}
              iconStyle={{ background: '#007bff', color: '#fff' }}
              container='card'
              cardHeaderStyle={{ background: '#007bff', color: '#fff' }}
              cardBodyStyle={{ background: '#f8f9fa' }}
              onClick={() => setSelectedEvent(event)}
              selected={selectedEvent === event}
            >
              <div>Lat: {event.lat}</div>
              <div>Lng: {event.lng}</div>
            </TimelineEvent>
          ))}
        </Timeline>
      </div>
      <audio ref={audioRef}></audio>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <button
          className='btn btn-primary'
          onClick={handleStart}
          disabled={!fromLocation || !toLocation}
        >
          Start Navigation
        </button>
      </div>
    </div>
  );
}

export default Manualmap;

