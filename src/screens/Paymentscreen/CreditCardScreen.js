import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, View, Text } from 'react-native';
import { SaveCardScreenStyle } from '../../styles';
import { AppHeader, Button, Container, Spacing } from '../../components';
import images from '../../index';
import { RouteName } from '../../routes';
import { SH } from '../../utils';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { CardField, createToken, confirmPayment } from '@stripe/stripe-react-native';
import axios from 'axios';
import creatPaymentIntent from './stripeApi';
import { useDispatch, useSelector } from 'react-redux';
import { add_my_order } from '../../redux/action/cartAction';

const CreditCardScreen = props => {
    const { myOrders, cartData } = useSelector(state => state.cartInfo)
    const { navigation } = props;
    const dispatch = useDispatch()
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const { Colors } = useTheme();
    const [cardState, setCardState] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        let total = Number(0)
        setTotalAmount(0)
        cartData.forEach(data => {
            total = Number(total) + Number(data.price.split(' – ')[0].replace('£', ''))
        })
        setTotalAmount(total)
    }, [cartData]);

    const fetchCardDetails = (cardDetails) => {
        if (cardDetails.complete) {
            setCardState(cardDetails)
        } else {
            setCardState(null)
        }
    }

    // const cardDone = async () => {
    //     if(!!cardState) {
    //         try {
    //             const resToken = await createToken({...cardState, type: 'Card'})
    //             console.log(resToken)
    //         } catch (e) {
    //             console.log(e);
    //         }
    //     }
    // }

    const handlePayment = async () => {

        // const { firstName, lastName, email, postalCode, Billing_Address, Shipping_Address } = userData; // Assuming you have collected user data somewhere

        let apiData = {
            amount: 500,
            currency: "EUR"
        }

        let itemName = []
        let itemSKU = []
        cartData.forEach(cart => {
            itemName.push(cart.name)
            itemSKU.push(cart.SKU)
        })

        /*const myOrderDetails = {
            orderDate: new Date(),
            items: itemName,
            SKUs: itemSKU,
            total: totalAmount,
            // firstName,
            // lastName,
            // email,
            // postalCode,
            // Billing_Address,
            // Shipping_Address
        }*/

        const myOrderDetails = {
            orderDate: new Date(),
            total: totalAmount,
            firstName: "firstName",
            lastName: "lastName",
            email: "ankitemail@gmail.com",
            postalCode: "302021",
            items: [
              {
                product_id: 3742,
                quantity: 1
              }
            ]
          };

        console.log('----', myOrderDetails)

        setLoading(true)

        try {
            const res = await creatPaymentIntent(apiData)
            console.log("payment intent create succesfully...!!!", res)

            if (res?.data?.paymentIntent) {
                let confirmPaymentIntent = await confirmPayment(res?.data?.paymentIntent, { paymentMethodType: 'Card' })
                console.log("confirmPaymentIntent res++++", confirmPaymentIntent)
                dispatch(add_my_order([...myOrders, myOrderDetails]))
                await axios.post("https://insomniapillsuk.com/wp-json/v1/orders/create", 
                    myOrderDetails)
                    .then(console.log)
                    .catch(console.log)
                setTimeout(() => {
                    setLoading(false)
                    navigation.navigate(RouteName.PAYMENT_SUCCESSFULLY)
                }, 3000)

            }
        } catch (error) {
            console.log("Error rasied during payment intent", error)
            dispatch(add_my_order([...myOrders, myOrderDetails]))
            await axios.post("https://insomniapillsuk.com/wp-json/v1/orders/create",
                myOrderDetails
            )
                .then(console.log)
                .catch(console.log)
            setTimeout(() => {
                setLoading(false)
                navigation.navigate(RouteName.PAYMENT_SUCCESSFULLY)
            }, 3000)
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Payment Screen</Text>
            <CardField
                postalCodeEnabled={false}
                placeholders={{
                    number: '4242 4242 4242 4242',
                }}
                cardStyle={{
                    backgroundColor: '#FFFFFF',
                    textColor: '#000000',
                }}
                style={{
                    width: '100%',
                    height: 50,
                    marginVertical: 30,
                }}
                onCardChange={(cardDetails) => {
                    fetchCardDetails(cardDetails);
                }}
                onFocus={(focusedField) => {
                    console.log('focusField', focusedField);
                }}
            />
            <Button title={loading ? 'Loading...' : 'Pay'} disable={cardState === null || loading} onPress={handlePayment} />
        </View>
    );
};

export default CreditCardScreen;
