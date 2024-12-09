const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
  
    const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(date);
    const [datePart, timePart] = formattedDate.split(", ");
    return `${datePart} ${timePart}`;
  };
  export default formatDate