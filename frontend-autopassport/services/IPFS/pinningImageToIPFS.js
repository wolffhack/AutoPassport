import axios from 'axios';

export const pinningImageToIPFS = async (file, PINATA_JWT) => {
  let CID;
  const formData = new FormData();
  //configuramos el archivo que va a subirse a pinata siguiendo la documentacion
  formData.append('file', file);
  const metadata = JSON.stringify({
    name: 'tokenImage',
  });
  formData.append('pinataMetadata', metadata);
  const options = JSON.stringify({
    cidVersion: 0,
  })
  formData.append('pinataOptions', options);

  try {
    //hacemos la peticion a pinata para subir el archivo y obtener el CID de la imagen que subimos a pinata
    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS/", formData, {
      maxBodyLength: "Infinity",
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        Authorization: PINATA_JWT
      }
    });
    console.log('IPFS image load succesfully');
    CID = res.data.IpfsHash;
  } catch (error) {
    console.log('Error fetching IPFS file: ', error);
  }
  //retornamos el CID de la imagen que subimos a pinata
  return CID;
}