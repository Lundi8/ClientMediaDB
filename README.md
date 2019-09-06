# ClientMediaDB

## Description

Simple api made with IndexedDB to download all needed files from server to client and get a persistant storage in client side (usefull for PWA).

## API

#### Call the API:

```
import clientMediaDB from './clientMediaDB';
const DB = clientMediaDB();
```

#### Save all needed file from server :

Call it in your first loaded file.

- function : saveAll(args, callback)
- args : array of filepath
- callback : return error as first argument and response that all files are downloaded as second

```
DB.saveAll(['static/videotest.mp4', 'static/videotest_4k.mp4'], (err, res) => {
    if (err) throw err;
    console.log('All Medias downloaded in DB!');
});
```

#### Load needed file from clientMediaDB :

Can be used every where in your code.

- function : load(args, callback)
- args : string of filepath
- callback : return error as first object as second

```
DB.load('static/videotest_4k.mp4', (err, obj) => {
    if(err) throw err;

    /**
    * obj -> { src, name, ext, blob }
    * src -> filePath // ex : static/videotest_4k.mp4
    * name -> fileName // ex : videotest_4k.mp4
    * ext -> fileExtension // ex : mp4
    * blob -> Blob object
    */

    if (obj) {
        let blob = URL.createObjectURL(obj.blob);

        // Use blob in your component 

        // ex react : 
        // <video src={blob} /> 

        // ex vanilla js :
        // document.getElementById('yourVideo').src = blob;
    }
});
```

## Exemple with Nextjs

```
import React from 'react';
import clientMediaDB from '../src/clientMediaDB';

const Page = () => {
  const DB = clientMediaDB();

  const [media, setMedia] = React.useState();
  const [progress, setProgess] = React.useState('Init DB');

  React.useEffect(() => {
    // Prevent unnecessary fetch
    if (!media) {
      setProgess('Downloading medias in DB, wait...');

      // Download all medias
      DB.saveAll(['static/videotest.mp4', 'static/videotest_4k.mp4'], (err, res) => {
        if (res) setProgess('Medias downloaded in DB!');

        // Load a media
        DB.load('static/videotest_4k.mp4', (err, obj) => {
          if (obj) {
            let blob = URL.createObjectURL(obj.blob);
            setMedia(blob);
          }
        });
      });
    }
  });

  // Prevent SSR
  if (!process.browser) return <div>Not in client side</div>;
  if (!('indexedDB' in window)) return <div>Not in client side</div>;

  return (
    <div>
      <p>Download process : {progress}</p>
      {media ? <video controls autoPlay loop style={{ width: '100%', height: '50vh' }} src={media}></video> : null}
      <hr></hr>
    </div>
  );
};

export default Page;

```
