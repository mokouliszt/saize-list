import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

import Home         from './pages/Home/Home';
import AddItem      from './pages/AddItem/AddItem';
import EditItem     from './pages/EditItem/EditItem';
import TagManager   from './pages/TagManager/TagManager';
import Settings     from './pages/Settings/Settings';
import SplashScreen from './components/SplashScreen';
import { useMenuStore } from './store/menuStore';

setupIonicReact({ mode: 'md' });

const App: React.FC = () => {
  const isLoading   = useMenuStore(s => s.isLoading);
  const splashStatus = useMenuStore(s => s.splashStatus);

  return (
    <IonApp>
      {isLoading && <SplashScreen status={splashStatus} />}
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home"      component={Home}       />
          <Route exact path="/add"       component={AddItem}    />
          <Route exact path="/edit/:id"  component={EditItem}   />
          <Route exact path="/tags"      component={TagManager} />
          <Route exact path="/settings"  component={Settings}   />
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
