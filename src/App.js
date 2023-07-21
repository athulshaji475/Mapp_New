import React from 'react'
import Map from './Components/Map'
import { useNavigate } from 'react-router-dom';
import {
  BrowserRouter as Router,
  Routes,
  Route
 
} from "react-router-dom";
import Splash from './Components/Splash';
import Manualmap from './Components/Manualmap';



function App() {

  



  return (
    <div style={{Height:'100%'}}>
 <div style={{backgroundColor:'gray'}}>
 <center></center> 
 </div>  
<Router>
<Routes>
<Route path='/' element={<Splash/>} />
  <Route path='/Map' element={<Map/>}/>
  <Route path='/Manualmap' element={<Manualmap/>}/>
</Routes>
</Router>




     
    </div>
  )
}

export default App