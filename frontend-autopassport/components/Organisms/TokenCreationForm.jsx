import React, { useState } from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import ImageUploader from '../Molecules/ImageUploader';
import getConfig from 'next/config'
import SelectInput from '../Molecules/SelectInput';
import { pinningImageToIPFS } from '../../services/IPFS/pinningImageToIPFS';
import { pinningMetadataToIPFS } from '../../services/IPFS/pinningMetadataToIPFS';
import { unpinningFileToIPFS } from '../../services/IPFS/unpinningFileToIPFS';
import { createAutoPassport } from '../../services/smart-contract/createAutoPassport';
import { getContract } from '../../services/smart-contract/getContract';
import { smartContractInteraction } from '../../services/smart-contract/smartContractInteraction';

export default function TokenCreationForm() {
  const router = useRouter();
  const [formValues, setFormValues] = useState({});
  const env = getConfig().publicRuntimeConfig;
  const contractAddress = env.SMART_CONTRACT_ADDRESS;
  const PINATA_JWT = env.PINATA_JWT;
  const contractABI = require("../../utils/AutoPassport.json").abi;
  
  const handleInputChange = (event) => {
    const { id, value } = event.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  const handleFile = async (fileData) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      image: fileData,
    }));
  };

  const handleSubmit = async (event) => {

    event.preventDefault();
    try {
      //temporal
      formValues.dateOfManufacture = new Date().toISOString().split('T')[0];
      //
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      formValues.walletAddress = accounts[0]?.toString();
      
      const imageCID = await pinningImageToIPFS(formValues.image, PINATA_JWT); 
      if (imageCID) {
        formValues['image'] = 'ipfs://' + imageCID;
      }

      const metadataCID = await pinningMetadataToIPFS(formValues, PINATA_JWT)
      if (metadataCID) {
        formValues['uriIpfsUrl'] = 'https://gateway.pinata.cloud/ipfs/'+ metadataCID;
      }

      await smartContractInteraction(getContract, formValues, createAutoPassport, contractAddress, contractABI);
      router.push('/');
    } catch (error) {
      const { message } = error;
      console.log(message);
      unpinningFileToIPFS(imageCID, PINATA_JWT)
      unpinningFileToIPFS(metadataCID, PINATA_JWT)
      alert(`Error to create AutoPassport: ${message}. Try later or contact with support`);
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex minH={'100vh'} align={'center'} justify={'center'}>
        <Stack
          spacing={4}
          w={'full'}
          maxW={'md'}
          bg={useColorModeValue('white', 'gray.700')}
          rounded={'xl'}
          boxShadow={'lg'}
          p={6}
          my={12}
        >
          <Heading lineHeight={1.1} fontSize={{ base: '2xl', sm: '3xl' }}>
            Create AutoPassport
          </Heading>
          <ImageUploader handleChange={handleFile} />

          <SelectInput
            id="typeOfFuel" 
            label="Type of fuel" 
            placeholder="Select type of fuel" 
            options={SELECT_FUEL_ITEMS} 
            onChange={handleInputChange} 
          />

          <SelectInput
            id="brand"
            label="Brand"
            placeholder="Select brand"
            options={SELECT_BRAND_ITEMS}
            onChange={handleInputChange}
          />

          {FORM_ITEMS.map((item, index) => (
            <FormControl key={index} id={item.id} isRequired>
              <FormLabel>{item.label}</FormLabel>
              <Input
                placeholder={item.placeholder}
                _placeholder={{ color: 'gray.500' }}
                type={item.type}
                onChange={handleInputChange}
                {...(item.maxLength && { maxLength: item.maxLength })}
                {...(item.max && { max: item.max })}
                {...(item.defaultValue && { defaultValue: item.defaultValue })}
              />
            </FormControl>
          ))}

          <Stack spacing={6} direction={['column', 'row']}>
            <Button
              w="full"
              _hover={{
                bg: 'red.500',
                color: 'white',
              }}
              onClick={() => router.push('/')}
            >
              Cancel
            </Button>
            <Button
              bg={'pink.400'}
              color={'white'}
              w="full"
              _hover={{
                bg: 'pink.300',
              }}
              type='submit'
            >
              Mint
            </Button>
          </Stack>
        </Stack>
      </Flex>
    </form>
  );
}

// TODO: - Export in another file and import here
//       - SELECT ITEMS must be fetched from a database.
const FORM_ITEMS = [
  // {
  //   id: 'brand',
  //   label: 'Brand',
  //   placeholder: 'Brand',
  //   type: 'text',
  // },
  {
    id: 'model',
    label: 'Model',
    placeholder: 'Model',
    type: 'text',
  },
  {
    id: 'vehicleIdentificationNumber',
    label: 'VIN',
    placeholder: 'VIN',
    type: 'text'
  },
  // {
  //   id: 'typeOfFuel',
  //   label: 'Type of fuel',
  //   placeholder: 'Type of fuel',
  //   type: 'text',
  // },
  {
    id: 'colorCode',
    label: 'Color code',
    placeholder: 'Color code',
    type: 'text'
  },
  {
    id: 'dateOfManufacture',
    label: 'Date of manufacture',
    placeholder: '',
    defaultValue: new Date().toISOString().split("T")[0],
    max: new Date().toISOString().split("T")[0],
    type: 'date',
  },
  {
    id: 'warrantyExpirationDate',
    label: 'Warranty expiration date',
    placeholder: '',
    type: 'date'
  },
];

const SELECT_FUEL_ITEMS = [
  { id: 1, value: 'gasoline', name: 'Gasoline' },
  { id: 2, value: 'diesel', name: 'Diesel' },
  { id: 3, value: 'electric', name: 'Electric' },
  { id: 4, value: 'hybrid', name: 'Hybrid' },
];

const SELECT_BRAND_ITEMS = [
  { key: 1, id: "audi", value: "Audi", name: "Audi" },
  { key: 2, id: "bmw", value: "BMW", name: "BMW"},
  { key: 3, id: "chevrolet", value: "Chevrolet", name: "Chevrolet" },
  { key: 4, id: "ford", value: "Ford", name: "Ford" },
  { key: 5, id: "honda", value: "Honda", name: "Honda" },
  { key: 6, id: "mercedes", value: "Mercedes-Benz", name: "Mercedes-Benz" },
  { key: 7, id: "nissan", value: "Nissan", name: "Nissan" },
  { key: 8, id: "toyota", value: "Toyota", name: "Toyota" },
  { key: 9, id: "volkswagen", value: "Volkswagen", name: "Volkswagen" },
];