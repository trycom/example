import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { Elements, CardElement, injectStripe } from "react-stripe-elements";
import { Container, Button, Row, Form, Col, ListGroup } from "react-bootstrap";
import moment from "moment";

const useInput = initialState => {
  const [value, setValue] = useState(initialState);

  function onChange(e) {
    setValue(e.target.value);
  }

  return {
    value,
    onChange
  };
};

const PaymentForm = props => {
  const emailInput = useInput();
  const firstNameInput = useInput();
  const lastNameInput = useInput();

  const { value: firstName } = firstNameInput;
  const { value: lastName } = lastNameInput;
  const { value: email } = emailInput;

  const handleSubmit = async ev => {
    // We don't want to let default form submission happen here, which would refresh the page.
    ev.preventDefault();

    try {
      const name = `${firstName} ${lastName}`;

      // Within the context of `Elements`, this call to createSource knows which Element to
      // tokenize, since there's only one in this group.
      const token = await props.stripe.createSource({
        owner: {
          name,
          email
        }
      });

      alert(`Success! Your token is: ${token}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Email address</Form.Label>
        <Form.Control {...emailInput} type="email" placeholder="Enter email" />
        <Form.Text className="text-muted">
          We'll never share your email with anyone else.
        </Form.Text>
      </Form.Group>
      <Form.Group>
        <Form.Label>First name</Form.Label>
        <Form.Control {...firstNameInput} type="name" placeholder="John" />
      </Form.Group>
      <Form.Group>
        <Form.Label>Last name</Form.Label>
        <Form.Control {...lastNameInput} type="name" placeholder="Malkovich" />
      </Form.Group>
      <Form.Group>
        <Form.Label>Card Details</Form.Label>
        <CardElement />
        <Form.Text className="text-muted">
          We'll never share card details with anyone else.
        </Form.Text>
      </Form.Group>
      <Button
        type="submit"
        disabled={
          !firstName || !lastName || !email || props.list.items.length <= 0
        }
      >
        Confirm order
      </Button>
    </Form>
  );
};

const InjectedPaymentForm = injectStripe(PaymentForm);

const PlanForm = props => {
  const totalAmountInput = useInput(0);
  const depositAmountInput = useInput(0);
  const numberOfInstallmentsInput = useInput(0);
  const intervalInput = useInput("month");
  const intervalCountInput = useInput(1);

  useEffect(() => {
    const { onChange } = props;
    if (onChange) {
      const totalAmount = Number(totalAmountInput.value);
      const depositAmount = Number(depositAmountInput.value);
      const numberOfInstallments = Number(numberOfInstallmentsInput.value);
      const amount = (totalAmount - depositAmount) / numberOfInstallments;

      const items =
        totalAmount > 0 && numberOfInstallments > 0
          ? [
              ...Array(
                numberOfInstallments + (depositAmount > 0 ? 1 : 0)
              ).keys()
            ].map((_, i) => {
              const returnObj = {
                amount,
                dueDate: moment()
              };
              if (depositAmount > 0 && i === 0) {
                return { ...returnObj, amount: depositAmount };
              }
              return returnObj;
            })
          : [];

      onChange({
        items,
        hasDeposit: depositAmountInput.value > 0,
        interval: intervalInput.value.toLowerCase()
      });
    }
  }, [
    totalAmountInput.value,
    depositAmountInput.value,
    numberOfInstallmentsInput.value,
    intervalInput.value,
    intervalCountInput.value
  ]);

  return (
    <Form>
      <Form.Group as={Col} controlId="formGridEmail">
        <Form.Label>Total Amount</Form.Label>
        <Form.Control {...totalAmountInput} placeholder="$0.00" />
      </Form.Group>

      <Form.Group as={Col} controlId="formGridEmail">
        <Form.Label>Deposit Amount</Form.Label>
        <Form.Control {...depositAmountInput} placeholder="$0.00" />
      </Form.Group>

      <Form.Group as={Col} controlId="formGridEmail">
        <Form.Label>Number of installments</Form.Label>
        <Form.Control {...numberOfInstallmentsInput} as="select">
          <option>Choose...</option>
          {[...Array(10).keys()]
            .map(i => i + 1)
            .map(i => (
              <option>{i}</option>
            ))}
        </Form.Control>
      </Form.Group>

      <Form.Group as={Col} controlId="formGridPassword">
        <Form.Label>Charge interval</Form.Label>
        <Form.Control {...intervalInput} as="select">
          <option>month</option>
          <option>week</option>
          <option>day</option>
          <option>year</option>
        </Form.Control>
      </Form.Group>

      <Form.Group as={Col} controlId="formGridEmail">
        <Form.Label>Charge frequency</Form.Label>
        <Form.Control {...intervalCountInput} as="select">
          {[...Array(10).keys()]
            .map(i => i + 1)
            .map(i => (
              <option>{i}</option>
            ))}
        </Form.Control>
      </Form.Group>
    </Form>
  );
};

const ListPlan = ({
  list = { items: [], hasDeposit: false, interval: "month" }
}) => (
  <ListGroup
    style={{ marginTop: "5px", marginLeft: "80px", marginRight: "80px" }}
  >
    {list.items.map(({ amount, dueDate }, i) => {
      return (
        <ListGroup.Item
          variant={i === 0 && list.hasDeposit ? "primary" : "success"}
        >
          ${amount} due {dueDate.add(i, list.interval).format("MMMM Do YYYY")}.
        </ListGroup.Item>
      );
    })}
  </ListGroup>
);

const App = () => {
  const [list, setList] = useState();

  return (
    <Container>
      <Row className="justify-content-md-center">
        <img src={logo} className="App-logo" alt="logo" />
      </Row>
      <Row className="justify-content-md-center">
        <PlanForm onChange={setList} />
        <ListPlan list={list} />
        <Elements>
          <InjectedPaymentForm list={list} />
        </Elements>
      </Row>
    </Container>
  );
};

export default App;
